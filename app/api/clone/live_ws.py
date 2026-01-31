"""
Live Voice WebSocket Handler using Google ADK Bidi-streaming

Enables real-time bidirectional audio streaming with Gemini Live API.
Connects the frontend to the live_agent via Runner.run_live().

Protocol (Frontend → Backend):
- {"type": "audio", "data": "<base64 PCM>"}  - Audio chunk (16kHz, 16-bit, mono)
- {"type": "text", "text": "..."}            - Text message
- {"type": "ping"}                           - Keep-alive

Protocol (Backend → Frontend):
- {"type": "connected", "session_id": "..."}
- {"type": "audio", "data": "<base64 PCM>"}  - Audio response (24kHz)
- {"type": "tool_call", "name": "...", "args": {...}}
- {"type": "error", "message": "..."}
- {"type": "pong"}
"""
from __future__ import annotations

import asyncio
import base64
import json
import time
import uuid
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from google.adk import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.sessions import InMemorySessionService
from google.genai import types

from .config import get_config


# =============================================================================
# GLOBALS & SESSION SERVICE
# =============================================================================

_session_service: Optional[InMemorySessionService] = None
_runner: Optional[Runner] = None

APP_NAME = "fido_live"


def get_session_service() -> InMemorySessionService:
    global _session_service
    if _session_service is None:
        _session_service = InMemorySessionService()
    return _session_service


def get_live_runner() -> Runner:
    global _runner
    if _runner is None:
        from .agent import live_agent
        _runner = Runner(
            agent=live_agent,
            app_name=APP_NAME,
            session_service=get_session_service()
        )
    return _runner


# =============================================================================
# WEBSOCKET HANDLER
# =============================================================================

async def handle_live_websocket(
    websocket: WebSocket,
    connection_id: str,
    api_key: str = ""
):
    """
    Handle a live voice WebSocket connection using ADK Bidi-streaming.
    
    This implements the pattern from ADK docs:
    - upstream_task: Receives from WebSocket → sends to LiveRequestQueue
    - downstream_task: Receives from run_live() → sends to WebSocket
    """
    config = get_config()
    
    # Simple API key check
    if api_key != config.OWNER_API_KEY:
        await websocket.close(code=4001, reason="Invalid API key")
        return
    
    await websocket.accept()
    
    session_service = get_session_service()
    runner = get_live_runner()
    
    user_id = "aarav"
    session_id = f"live_{connection_id}"
    
    # Create session
    await session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id
    )
    
    # Create LiveRequestQueue for bidirectional communication
    live_request_queue = LiveRequestQueue()
    
    # Configure for audio streaming
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Fenrir"
                )
            )
        )
    )
    
    # Notify client of successful connection
    await websocket.send_json({
        "type": "connected",
        "session_id": session_id,
        "ts": time.time()
    })
    
    print(f"🎙️ Live session started: {session_id}")
    
    # =========================================================================
    # UPSTREAM TASK: WebSocket → LiveRequestQueue
    # =========================================================================
    async def upstream_task():
        """Receives audio/text from WebSocket, sends to agent via queue."""
        try:
            while True:
                raw_data = await websocket.receive_text()
                
                try:
                    msg = json.loads(raw_data)
                except json.JSONDecodeError:
                    continue
                
                msg_type = msg.get("type", "")
                
                if msg_type == "audio":
                    # Decode base64 audio and send to agent
                    audio_b64 = msg.get("data", "")
                    if audio_b64:
                        audio_bytes = base64.b64decode(audio_b64)
                        audio_blob = types.Blob(
                            mime_type="audio/pcm;rate=16000",
                            data=audio_bytes
                        )
                        live_request_queue.send_realtime(audio_blob)
                
                elif msg_type == "text":
                    # Send text content
                    text = msg.get("text", "").strip()
                    if text:
                        content = types.Content(
                            parts=[types.Part(text=text)]
                        )
                        live_request_queue.send_content(content)
                
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    
        except WebSocketDisconnect:
            print(f"🎙️ Client disconnected: {session_id}")
        except Exception as e:
            print(f"❌ Upstream error: {e}")
    
    # =========================================================================
    # DOWNSTREAM TASK: run_live() → WebSocket
    # =========================================================================
    async def downstream_task():
        """Receives events from agent, sends to WebSocket."""
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config
            ):
                try:
                    # Handle audio output
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, 'inline_data') and part.inline_data:
                                # Audio data - send as base64
                                audio_data = part.inline_data.data
                                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                                await websocket.send_json({
                                    "type": "audio",
                                    "data": audio_b64
                                })
                    
                    # Handle tool calls
                    if hasattr(event, 'actions') and event.actions:
                        tool_calls = getattr(event.actions, 'tool_calls', None)
                        if tool_calls:
                            for tc in tool_calls:
                                await websocket.send_json({
                                    "type": "tool_call",
                                    "name": tc.name if hasattr(tc, 'name') else str(tc),
                                    "args": tc.args if hasattr(tc, 'args') else {}
                                })
                                
                except Exception as e:
                    print(f"⚠️ Event processing error: {e}")
                    
        except Exception as e:
            print(f"❌ Downstream error: {e}")
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
            except:
                pass
    
    # =========================================================================
    # KEEPALIVE TASK: Prevent Google API timeout
    # =========================================================================
    async def keepalive_task():
        """Send periodic silent audio to prevent Google API timeout."""
        # Create 100ms of silence (16kHz, 16-bit mono = 3200 bytes)
        silent_audio = bytes(3200)
        
        try:
            while True:
                await asyncio.sleep(5)  # Send keepalive every 5 seconds
                
                # Send silent audio blob to keep connection alive
                audio_blob = types.Blob(
                    mime_type="audio/pcm;rate=16000",
                    data=silent_audio
                )
                live_request_queue.send_realtime(audio_blob)
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"⚠️ Keepalive error: {e}")
    
    # =========================================================================
    # RUN ALL TASKS CONCURRENTLY
    # =========================================================================
    try:
        await asyncio.gather(
            upstream_task(),
            downstream_task(),
            # keepalive_task(),
            return_exceptions=True
        )
    finally:
        # Always close the queue to signal termination
        live_request_queue.close()
        print(f"🎙️ Live session ended: {session_id}")
