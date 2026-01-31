from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any, Callable, Optional
from asyncio import PriorityQueue, Queue


class Priority(IntEnum):
    """
    Task priority levels.
    
    Lower number = Higher priority (executed first).
    """
    URGENT = 1      # Voice commands, safety, critical errors, user waiting
    HIGH = 2        # Important notifications, explicit user requests
    MEDIUM = 3      # Tool executions, chat responses
    LOW = 4         # Background monitoring, proactive suggestions
    BACKGROUND = 5  # Logging, cleanup, daily summaries


@dataclass(order=True)
class Task:
    """
    A task to be executed by the orchestrator.
    
    Tasks are ordered by priority (lower = higher priority).
    """
    priority: Priority = field(compare=True)
    name: str = field(compare=False)
    callback: Callable = field(compare=False)
    args: dict[str, Any] = field(default_factory=dict, compare=False)
    interruptible: bool = field(default=True, compare=False)
    created_at: float = field(default_factory=time.time, compare=False)
    task_id: str = field(default_factory=lambda: str(int(time.time() * 1000)), compare=False)


class Orchestrator:
    """
    Central task coordinator for Fido AI.
    
    Manages:
    - Task priorities (URGENT → BACKGROUND)
    - Interruptions (high priority can interrupt low priority)
    - Task queue and execution
    - System state (streaming, busy, idle)
    
    Use Cases:
    - Voice command interrupts text chat
    - Background monitor runs when idle
    - Multiple tasks execute in priority order
    - Critical tasks pause non-critical work
    """
    
    def __init__(self):
        self.task_queue: PriorityQueue[tuple[Priority, Task]] = PriorityQueue()
        self.current_task: Optional[Task] = None
        self.paused_tasks: list[Task] = []
        self.running_background: dict[str, asyncio.Task] = {}
        
        # System state
        self.state = {
            "mode": "idle",           # idle, busy, streaming, voice_active
            "streaming": False,       # Is currently streaming a response
            "can_interrupt": True,    # Can current task be interrupted
            "tasks_queued": 0,        # Tasks in queue
            "tasks_completed": 0,     # Total tasks completed
        }
        
        self._running = False
        self._loop_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the orchestrator main loop."""
        if self._running:
            return
        
        self._running = True
        self._loop_task = asyncio.create_task(self._main_loop())
        print("🎯 Orchestrator started")
    
    async def stop(self):
        """Stop the orchestrator."""
        self._running = False
        if self._loop_task:
            self._loop_task.cancel()
            try:
                await self._loop_task
            except asyncio.CancelledError:
                pass
        print("🛑 Orchestrator stopped")
    
    async def _main_loop(self):
        """Main orchestrator loop - processes tasks from queue."""
        while self._running:
            try:
                # Get next task (blocks if queue empty, with timeout)
                try:
                    priority, task = await asyncio.wait_for(
                        self.task_queue.get(),
                        timeout=60.0
                    )
                except asyncio.TimeoutError:
                    # No tasks, continue loop
                    self.state["mode"] = "idle"
                    continue
                
                # Check if should interrupt current task
                if self.current_task:
                    if priority < self.current_task.priority and self.current_task.interruptible:
                        # Higher priority task! Pause current
                        await self._pause_current_task()
                    else:
                        # Can't interrupt, requeue the new task
                        await self.task_queue.put((priority, task))
                        await asyncio.sleep(0.1)
                        continue
                
                # Execute the task
                await self._execute_task(task)
                
                # Resume paused tasks if any
                if self.paused_tasks:
                    await self._resume_paused_task()
                
            except Exception as e:
                print(f"❌ Orchestrator error: {e}")
                self.current_task = None
    
    async def queue_task(
        self,
        priority: Priority,
        name: str,
        callback: Callable,
        args: dict[str, Any] | None = None,
        interruptible: bool = True
    ) -> str:
        """
        Queue a task for execution.
        
        Args:
            priority: Task priority (URGENT to BACKGROUND)
            name: Human-readable task name
            callback: Async function to execute
            args: Arguments to pass to callback
            interruptible: Can this task be interrupted by higher priority
        
        Returns:
            Task ID
        
        Example:
            task_id = await orchestrator.queue_task(
                Priority.HIGH,
                "process_voice_command",
                handle_voice,
                {"text": "turn on lights"}
            )
        """
        task = Task(
            priority=priority,
            name=name,
            callback=callback,
            args=args or {},
            interruptible=interruptible
        )
        
        await self.task_queue.put((priority, task))
        self.state["tasks_queued"] = self.task_queue.qsize()
        
        print(f"📋 Queued: {name} (Priority: {priority.name})")
        return task.task_id
    
    async def interrupt(
        self,
        priority: Priority,
        name: str,
        callback: Callable,
        args: dict[str, Any] | None = None
    ) -> Any:
        """
        Execute a task immediately, interrupting current work if needed.
        
        Use for urgent tasks that can't wait (voice commands, safety).
        
        Returns:
            Result of the task execution
        """
        if self.current_task and self.current_task.interruptible:
            await self._pause_current_task()
        
        task = Task(
            priority=priority,
            name=name,
            callback=callback,
            args=args or {},
            interruptible=False  # Urgent tasks can't be interrupted
        )
        
        result = await self._execute_task(task)
        
        # Resume what was interrupted
        if self.paused_tasks:
            await self._resume_paused_task()
        
        return result
    
    async def _execute_task(self, task: Task) -> Any:
        """Execute a task and update state."""
        self.current_task = task
        self.state["mode"] = "busy"
        self.state["can_interrupt"] = task.interruptible
        
        print(f"⚡ Executing: {task.name}")
        
        try:
            # Execute the callback
            if asyncio.iscoroutinefunction(task.callback):
                result = await task.callback(**task.args)
            else:
                result = task.callback(**task.args)
            
            print(f"✅ Completed: {task.name}")
            self.state["tasks_completed"] += 1
            return result
            
        except Exception as e:
            print(f"❌ Task failed: {task.name} - {e}")
            raise
        finally:
            self.current_task = None
            self.state["mode"] = "idle"
    
    async def _pause_current_task(self):
        """Pause the current task for later resumption."""
        if self.current_task:
            print(f"⏸️  Pausing: {self.current_task.name}")
            self.paused_tasks.append(self.current_task)
            self.current_task = None
    
    async def _resume_paused_task(self):
        """Resume the most recently paused task."""
        if self.paused_tasks:
            task = self.paused_tasks.pop()
            print(f"▶️  Resuming: {task.name}")
            await self.task_queue.put((task.priority, task))
    
    def is_busy(self) -> bool:
        """Check if orchestrator is currently busy with a task."""
        return self.current_task is not None
    
    def can_handle_new_task(self, priority: Priority) -> bool:
        """Check if a new task with given priority can be handled now."""
        if not self.current_task:
            return True
        
        # Can handle if new task has higher priority and current is interruptible
        return priority < self.current_task.priority and self.current_task.interruptible
    
    def get_status(self) -> dict[str, Any]:
        """Get current orchestrator status."""
        return {
            "state": self.state,
            "current_task": {
                "name": self.current_task.name,
                "priority": self.current_task.priority.name,
                "interruptible": self.current_task.interruptible,
                "running_for": time.time() - self.current_task.created_at
            } if self.current_task else None,
            "queue_size": self.task_queue.qsize(),
            "paused_tasks": len(self.paused_tasks),
            "background_tasks": len(self.running_background)
        }


# Global orchestrator instance
_orchestrator: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """Get the global orchestrator instance (singleton)."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator

