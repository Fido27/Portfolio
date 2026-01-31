"""
WebSocket Chat Endpoint with Streaming

Connects frontend to the orchestrator agent via WebSocket using Google ADK.
Streams response text as it's generated.

Protocol:
- Client sends: {"type": "message", "content": "..."}
- Server sends: {"type": "start", "id": "..."} when response starts
- Server sends: {"type": "delta", "delta": "...", "id": "..."} for each text chunk
- Server sends: {"type": "done", "content": "...", "id": "..."} when complete
- Server sends: {"type": "proactive", "content": "..."} for agent-initiated messages
"""
from __future__ import annotations

import json
import time
from typing import Any, Optional, Callable, Awaitable
from dataclasses import dataclass, field
from fastapi import WebSocket, WebSocketDisconnect

from google.adk import Runner
from google.adk.runners import RunConfig
from google.adk.agents.run_config import StreamingMode
from google.adk.sessions import InMemorySessionService
from google.genai import types

from .config import get_config


@dataclass
class Message:
    """Chat message."""
    id: str
    role: str
    content: str
    ts: float = field(default_factory=time.time)


class ChatSession:
    """Chat session using Google ADK Runner with streaming support."""
    
    def __init__(self):
        self.config = get_config()
        self.user_id = "aarav"
        self.session_id = f"session_{int(time.time() * 1000)}"
        self.messages: list[Message] = []
        
        self._runner: Optional[Runner] = None
        self._session_service = InMemorySessionService()
        self._session_created = False
    
    async def _ensure_session(self):
        if not self._session_created:
            await self._session_service.create_session(
                app_name="fido_chat",
                user_id=self.user_id,
                session_id=self.session_id
            )
            self._session_created = True
    
    def _get_runner(self) -> Runner:
        if self._runner is None:
            from .agent import orchestrator
            self._runner = Runner(
                agent=orchestrator,
                app_name="fido_chat",
                session_service=self._session_service
            )
        return self._runner
    
    def add_message(self, role: str, content: str) -> Message:
        msg = Message(
            id=f"{int(time.time() * 1000)}",
            role=role,
            content=content
        )
        self.messages.append(msg)
        return msg
    
    async def generate_response_streaming(
        self, 
        user_message: str,
        on_delta: Callable[[str], Awaitable[None]]
    ) -> str:
        """
        Generate response with streaming.
        Calls on_delta(text) for each text chunk as it arrives.
        Returns the full response at the end.
        """
        self.add_message("user", user_message)
        
        await self._ensure_session()
        runner = self._get_runner()
        
        user_content = types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_message)]
        )
        
        full_response = ""
        
        # Enable SSE streaming mode
        run_config = RunConfig(streaming_mode=StreamingMode.SSE)
        
        async for event in runner.run_async(
            user_id=self.user_id,
            session_id=self.session_id,
            new_message=user_content,
            run_config=run_config
        ):
            text_chunk = ""
            
            try:
                if isinstance(event, str):
                    text_chunk = event
                elif hasattr(event, 'text') and event.text:
                    text_chunk = event.text
                elif hasattr(event, 'content') and event.content:
                    content = event.content
                    if hasattr(content, 'parts') and content.parts:
                        for part in content.parts:
                            if hasattr(part, 'text') and part.text:
                                text_chunk += part.text
                    elif isinstance(content, str):
                        text_chunk = content
            except Exception as e:
                print(f"⚠️ Event parse: {e}")
            
            # Stream the chunk if we got text
            if text_chunk:
                full_response += text_chunk
                await on_delta(text_chunk)
        
        if not full_response:
            full_response = "I processed your request."
            await on_delta(full_response)
        
        self.add_message("assistant", full_response)
        return full_response
    
    async def generate_response(self, user_message: str) -> str:
        """
        Generate response without streaming (for scheduled tasks, etc).
        Returns the full response.
        """
        # Use streaming internally but just collect the result
        async def noop_delta(text: str):
            pass
        
        return await self.generate_response_streaming(user_message, noop_delta)


class ConnectionManager:
    """Manages active WebSocket connections."""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.sessions: dict[str, ChatSession] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        self.sessions[connection_id] = ChatSession()
        print(f"💬 Chat connected: {connection_id}")
    
    def disconnect(self, connection_id: str):
        self.active_connections.pop(connection_id, None)
        self.sessions.pop(connection_id, None)
        print(f"💬 Chat disconnected: {connection_id}")
    
    def has_connections(self) -> bool:
        return len(self.active_connections) > 0
    
    async def broadcast(self, message: dict):
        disconnected = []
        for conn_id, ws in self.active_connections.items():
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(conn_id)
        for conn_id in disconnected:
            self.disconnect(conn_id)
    
    async def send_proactive_message(self, content: str) -> bool:
        if not self.has_connections():
            return False
        await self.broadcast({
            "type": "proactive",
            "content": content,
            "id": f"proactive_{int(time.time() * 1000)}",
            "ts": time.time()
        })
        return True


_manager: Optional[ConnectionManager] = None


def get_connection_manager() -> ConnectionManager:
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager


async def handle_chat_websocket(websocket: WebSocket, connection_id: str):
    """Handle a chat WebSocket connection with streaming."""
    manager = get_connection_manager()
    await manager.connect(websocket, connection_id)
    
    try:
        await websocket.send_json({"type": "connected", "id": connection_id})
        
        while True:
            raw_data = await websocket.receive_text()
            
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue
            
            msg_type = data.get("type", "")
            
            if msg_type == "message":
                content = data.get("content", "").strip()
                if not content:
                    continue
                
                session = manager.sessions.get(connection_id)
                if not session:
                    session = ChatSession()
                    manager.sessions[connection_id] = session
                
                message_id = f"resp_{int(time.time() * 1000)}"
                
                try:
                    # Signal start of response
                    await websocket.send_json({
                        "type": "start",
                        "id": message_id,
                        "ts": time.time()
                    })
                    
                    # Stream deltas
                    async def send_delta(text: str):
                        await websocket.send_json({
                            "type": "delta",
                            "delta": text,
                            "id": message_id
                        })
                    
                    full_response = await session.generate_response_streaming(
                        content, 
                        on_delta=send_delta
                    )
                    
                    # Signal completion
                    await websocket.send_json({
                        "type": "done",
                        "content": full_response,
                        "id": message_id,
                        "ts": time.time()
                    })
                    
                except Exception as e:
                    print(f"❌ Error: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
            
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        manager.disconnect(connection_id)
