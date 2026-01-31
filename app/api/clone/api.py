"""
Fido Clone API - Minimal WebSocket-based AI Assistant

Endpoints:
- WebSocket /ws - Real-time chat
- WebSocket /voice/live - Real-time voice with Gemini Live API
- POST /proactive/test - Test proactive messaging
- GET /proactive/status - Check connected clients
- POST /scheduler/schedule - Schedule a task
- GET /scheduler/status - Get scheduler status
- GET /scheduler/tasks - List scheduled tasks
- DELETE /scheduler/task/{id} - Cancel scheduled task
"""
from __future__ import annotations

import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse

from .chat_ws import handle_chat_websocket, get_connection_manager
from .live_ws import handle_live_websocket
from .orchestrator import get_orchestrator, Priority
from .scheduler import get_scheduler

api = APIRouter(prefix="/clone", tags=["clone"])


# =============================================================================
# WEBSOCKET CHAT
# =============================================================================

@api.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat with ADK agent.
    
    Protocol:
    - Client sends: {"type": "message", "content": "..."}
    - Server sends: {"type": "start", "id": "..."} - response starting
    - Server sends: {"type": "delta", "delta": "...", "id": "..."} - text chunk
    - Server sends: {"type": "done", "content": "...", "id": "..."} - complete
    - Server sends: {"type": "proactive", "content": "..."} - agent-initiated
    """
    connection_id = str(uuid.uuid4())
    await handle_chat_websocket(websocket, connection_id)


# =============================================================================
# LIVE VOICE (Gemini Live API)
# =============================================================================

@api.websocket("/voice/live")
async def voice_live_websocket(websocket: WebSocket, api_key: str = Query("")):
    """
    WebSocket endpoint for real-time voice with Gemini Live API.
    
    Uses ADK bidi-streaming for low-latency bidirectional audio:
    - Client sends: {"type": "audio", "data": "<base64 PCM 16kHz>"}
    - Client sends: {"type": "text", "text": "..."}
    - Server sends: {"type": "audio", "data": "<base64 PCM 24kHz>"}
    - Server sends: {"type": "transcript", "source": "input|output", "text": "..."}
    - Server sends: {"type": "tool_call", "name": "...", "args": {...}}
    """
    connection_id = str(uuid.uuid4())
    await handle_live_websocket(websocket, connection_id, api_key)


# =============================================================================
# PROACTIVE MESSAGING
# =============================================================================

@api.post("/proactive/test")
async def test_proactive_message(request: dict):
    """
    Test endpoint to trigger a proactive message.
    
    Body: {"message": "Hello from the agent!"}
    """
    message = request.get("message", "Test proactive message from Fido!")
    manager = get_connection_manager()
    
    if not manager.has_connections():
        return JSONResponse(
            {"ok": False, "error": "No clients connected"},
            status_code=400
        )
    
    sent = await manager.send_proactive_message(message)
    return {"ok": sent, "connections": len(manager.active_connections)}


@api.get("/proactive/status")
async def proactive_status():
    """Check if any clients are connected."""
    manager = get_connection_manager()
    return {
        "has_connections": manager.has_connections(),
        "connection_count": len(manager.active_connections)
    }


# =============================================================================
# ORCHESTRATOR
# =============================================================================

@api.get("/orchestrator/status")
async def get_orchestrator_status():
    """Get orchestrator status."""
    orchestrator = get_orchestrator()
    return orchestrator.get_status()


# =============================================================================
# SCHEDULER
# =============================================================================

@api.get("/scheduler/status")
async def get_scheduler_status():
    """Get scheduler status."""
    scheduler = get_scheduler()
    return scheduler.get_status()


@api.post("/scheduler/start")
async def start_scheduler():
    """Start the task scheduler."""
    scheduler = get_scheduler()
    if scheduler._running:
        return {"ok": True, "message": "Already running"}
    
    await scheduler.start()
    return {"ok": True, "message": "Scheduler started"}


@api.post("/scheduler/stop")
async def stop_scheduler():
    """Stop the task scheduler."""
    scheduler = get_scheduler()
    if not scheduler._running:
        return {"ok": True, "message": "Already stopped"}
    
    scheduler.stop()
    return {"ok": True, "message": "Scheduler stopped"}


@api.get("/scheduler/tasks")
async def list_scheduled_tasks():
    """List all pending scheduled tasks."""
    scheduler = get_scheduler()
    tasks = scheduler.list_scheduled()
    return {
        "ok": True,
        "tasks": [
            {
                "id": t.task_id,
                "name": t.task_name,
                "action": t.action,
                "scheduled_for": t.scheduled_for.isoformat(),
                "status": t.status,
            }
            for t in tasks
        ]
    }


@api.delete("/scheduler/task/{task_id}")
async def cancel_scheduled_task(task_id: str):
    """Cancel a scheduled task."""
    scheduler = get_scheduler()
    cancelled = await scheduler.cancel_task(task_id)
    
    if not cancelled:
        return JSONResponse(
            {"ok": False, "error": "Task not found"},
            status_code=404
        )
    
    return {"ok": True, "message": f"Task {task_id} cancelled"}


@api.post("/scheduler/schedule")
async def schedule_task(request: dict):
    """
    Schedule a new task.
    
    Body:
    {
        "name": "Remind me to drink water",
        "action": "send_notification",
        "run_at": "in 30 minutes",
        "args": {"message": "Drink water!", "title": "Reminder"}
    }
    """
    name = request.get("name", "Scheduled task")
    action = request.get("action", "send_notification")
    run_at = request.get("run_at", "in 5 minutes")
    args = request.get("args", {})
    priority = Priority(request.get("priority", 3))
    
    scheduler = get_scheduler()
    task = await scheduler.schedule_task(
        user_id="aarav",  # No auth for now
        name=name,
        action=action,
        run_at=run_at,
        priority=priority,
        args=args
    )
    
    return {
        "ok": True,
        "task": {
            "id": task.task_id,
            "name": task.task_name,
            "scheduled_for": task.scheduled_for.isoformat()
        }
    }
