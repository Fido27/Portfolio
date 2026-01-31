from __future__ import annotations

import asyncio
import json
import time
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Callable, Optional
from dataclasses import dataclass, field
from appwrite.query import Query

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.cron import CronTrigger
# import dateparser - REMOVED
# from dateutil.relativedelta import relativedelta - REMOVED

from .orchestrator import get_orchestrator, Priority
from .store import get_store
from .config import get_config


@dataclass
class ScheduledTask:
    """
    A scheduled task that will execute at a specific time.
    """
    task_id: str
    user_id: str
    task_name: str
    prompt: str
    # scheduled_for is now Optional (None if recurring)
    scheduled_for: datetime | None = None
    priority: Priority = Priority.MEDIUM
    recurrence: Optional[str] = None
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    executed_at: Optional[datetime] = None
    error: Optional[str] = None


class TaskScheduler:
    """
    Intelligent task scheduler with natural language time parsing.
    
    Features:
    - Parse natural language ("in 5 minutes", "tomorrow at 3pm")
    - Schedule tasks via APScheduler
    - Persist to Appwrite (survives restarts)
    - Execute via orchestrator (respects priorities)
    - Handle missed tasks on restart
    
    Example:
        scheduler = get_scheduler()
        await scheduler.schedule_task(
            user_id="owner",
            name="Reminder to drink water",
            action="send_notification",
            run_at="in 5 minutes",
            args={"message": "Time to drink water!"}
        )
    """
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.running = False
        self._task_map: dict[str, ScheduledTask] = {}  # task_id -> ScheduledTask
        
    async def start(self):
        """
        Start the scheduler.
        
        Loads all pending tasks from Appwrite and schedules them.
        """
        if self.running:
            return
        
        print("🕐 Starting task scheduler...")
        
        # Start APScheduler
        self.scheduler.start()
        self.running = True
        
        # Load pending tasks from Appwrite
        await self._load_pending_tasks()
        
        print(f"✅ Scheduler started with {len(self._task_map)} pending tasks")
    
    async def stop(self):
        """Stop the scheduler."""
        if not self.running:
            return
        
        print("🛑 Stopping task scheduler...")
        self.scheduler.shutdown(wait=False)
        self.running = False
        print("✅ Scheduler stopped")
    
    async def schedule_task(
        self,
        user_id: str,
        name: str,
        prompt: str,
        schedule: str,  # ISO 8601 or Cron
        priority: Priority = Priority.MEDIUM,
    ) -> ScheduledTask:
        """
        Schedule a task.
        
        Args:
            schedule: Either an ISO 8601 timestamp (one-time) or a Cron expression (recurring).
        """
        # Determine if One-time or Recurring
        scheduled_for = None
        recurrence = None
        
        # Try to parse as ISO datetime first (One-Time)
        try:
            scheduled_for = datetime.fromisoformat(schedule)
            # Ensure it's in the future? Optional check.
        except ValueError:
            # Not ISO, assume Cron (Recurring)
            # Basic validation for Cron?
            recurrence = schedule
            
        # Generate task ID
        task_id = f"task_{int(time.time() * 1000000) % (10 ** 9)}"
        
        # Create task object
        task = ScheduledTask(
            task_id=task_id,
            user_id=user_id,
            task_name=name,
            prompt=prompt,
            scheduled_for=scheduled_for,
            recurrence=recurrence,
            priority=priority,
            status="pending",
            created_at=datetime.now()
        )
        
        # Store in Appwrite
        await self._save_task(task)
        
        # Schedule in APScheduler
        self._schedule_task_execution(task)
        
        # Track in memory
        self._task_map[task_id] = task
        
        time_desc = scheduled_for.strftime('%I:%M %p') if scheduled_for else f"Recurrence: {recurrence}"
        print(f"📅 Scheduled '{name}' for {time_desc}")
        
        return task
    
    # parse_time REMOVED
    
    def _schedule_task_execution(self, task: ScheduledTask):
        """
        Schedule task execution in APScheduler.
        """
        # Create callback that executes via orchestrator
        async def execute():
            await self._execute_task(task.task_id)
        
        # Determine trigger
        trigger = None
        
        if task.recurrence:
            print(f"🔄 Scheduling recurring task '{task.task_name}' with cron: {task.recurrence}")
            trigger = CronTrigger.from_crontab(task.recurrence)
        elif task.scheduled_for:
            print(f"📅 Scheduling one-time task '{task.task_name}' at {task.scheduled_for}")
            trigger = DateTrigger(run_date=task.scheduled_for)
        else:
            print(f"❌ Task {task.task_name} has neither time nor recurrence")
            return
            
        # Schedule in APScheduler
        self.scheduler.add_job(
            execute,
            trigger=trigger,
            id=task.task_id,
            name=task.task_name,
            replace_existing=True
        )
    
    async def _execute_task(self, task_id: str):
        """
        Execute a scheduled task by sending its prompt to the AI agent.
        
        Args:
            task_id: ID of task to execute
        """
        task = self._task_map.get(task_id)
        if not task:
            print(f"⚠️ Task {task_id} not found in memory")
            return
        
        print(f"⚡ Executing scheduled task: {task.task_name}")
        print(f"   Prompt: {task.prompt}")
        
        try:
            # Use ChatSession to send prompt to AI agent
            from .chat_ws import ChatSession, get_connection_manager
            
            # Create a session for this scheduled task
            session = ChatSession()
            
            # Generate response from AI agent
            response = await session.generate_response(task.prompt)
            
            # Update task status
            task.status = "completed"
            task.executed_at = datetime.now()
            await self._save_task(task)
            
            # Send the AI's response as a proactive message
            manager = get_connection_manager()
            if manager.has_connections():
                await manager.send_proactive_message(response)
            else:
                print(f"📤 No clients connected. Response: {response}")
            
            print(f"✅ Task '{task.task_name}' completed")
            
        except Exception as e:
            print(f"❌ Task '{task.task_name}' failed: {e}")
            task.status = "failed"
            task.error = str(e)
            task.executed_at = datetime.now()
            await self._save_task(task)
        
        # Remove from memory
        if task_id in self._task_map:
            del self._task_map[task_id]
    
    async def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a scheduled task.
        
        Args:
            task_id: ID of task to cancel
        
        Returns:
            True if task was cancelled, False if not found
        """
        task = self._task_map.get(task_id)
        if not task:
            return False
        
        # Remove from APScheduler
        try:
            self.scheduler.remove_job(task_id)
        except Exception:
            pass  # Already executed or not found
        
        # Update status in Appwrite
        task.status = "cancelled"
        await self._save_task(task)
        
        # Remove from memory
        del self._task_map[task_id]
        
        print(f"🚫 Cancelled task: {task.task_name}")
        return True
    
    async def list_scheduled(self, user_id: str | None = None) -> list[ScheduledTask]:
        """
        Get all pending scheduled tasks.
        
        Args:
            user_id: Filter by user (optional)
        
        Returns:
            List of pending tasks
        """
        tasks = list(self._task_map.values())
        
        if user_id:
            tasks = [t for t in tasks if t.user_id == user_id]
        
        # Sort by scheduled time
        tasks.sort(key=lambda t: t.scheduled_for)
        
        return tasks
    
    async def _save_task(self, task: ScheduledTask):
        """
        Save task to Appwrite.
        
        Args:
            task: Task to save
        """
        store = get_store()
        config = get_config()
        
        # Convert to dict for Appwrite
        doc = {
            "taskId": task.task_id,
            "userId": task.user_id,
            "taskName": task.task_name,
            "prompt": task.prompt,
            "scheduledFor": task.scheduled_for.isoformat() if task.scheduled_for else None,
            "priority": task.priority.name,
            "recurrence": task.recurrence,  # NEW
            "status": task.status,
            "createdAt": task.created_at.isoformat(),
            "executedAt": task.executed_at.isoformat() if task.executed_at else None,
            "error": task.error
        }
        
        # Check if exists
        try:
            # Try to get existing
            existing = store.db.get_document(
                database_id=config.APPWRITE_DB_ID,
                collection_id=config.APPWRITE_SCHEDULED_TASKS_COLL_ID,
                document_id=task.task_id
            )
            
            # Update
            store.db.update_document(
                database_id=config.APPWRITE_DB_ID,
                collection_id=config.APPWRITE_SCHEDULED_TASKS_COLL_ID,
                document_id=task.task_id,
                data=doc
            )
        except Exception:
            # Create new
            store.db.create_document(
                database_id=config.APPWRITE_DB_ID,
                collection_id=config.APPWRITE_SCHEDULED_TASKS_COLL_ID,
                document_id=task.task_id,
                data=doc
            )
    
    async def _load_pending_tasks(self):
        """
        Load all pending tasks from Appwrite and schedule them.
        
        Handles missed tasks (scheduled time in the past).
        """
        store = get_store()
        config = get_config()
        
        try:
            # Get all pending tasks
            result = store.db.list_documents(
                database_id=config.APPWRITE_DB_ID,
                collection_id=config.APPWRITE_SCHEDULED_TASKS_COLL_ID,
                queries=[
                    Query.equal("status", "pending")
                ]
            )
            
            now = datetime.now()
            
            for doc in result['documents']:
                # Parse task
                task = ScheduledTask(
                    task_id=doc['taskId'],
                    user_id=doc['userId'],
                    task_name=doc['taskName'],
                    prompt=doc['prompt'],
                    scheduled_for=datetime.fromisoformat(doc['scheduledFor']) if doc.get('scheduledFor') else None,
                    priority=Priority[doc['priority']],
                    recurrence=doc.get('recurrence'),  # NEW
                    status=doc['status'],
                    created_at=datetime.fromisoformat(doc['createdAt'])
                )
                
                # Check if missed (only if one-time task)
                if task.scheduled_for and task.scheduled_for < now:
                    print(f"⚠️ Missed task: {task.task_name} (was scheduled for {task.scheduled_for})")
                    
                    # Option 1: Execute immediately
                    # await self._execute_task(task.task_id)
                    
                    # Option 2: Skip missed tasks (current behavior)
                    task.status = "cancelled"
                    task.error = "Missed due to server restart"
                    await self._save_task(task)
                    continue
                
                # Schedule for execution
                self._schedule_task_execution(task)
                self._task_map[task.task_id] = task
                
            print(f"📂 Loaded {len(self._task_map)} pending tasks from Appwrite")
            
        except Exception as e:
            print(f"⚠️ Could not load tasks from Appwrite: {e}")
    
    def get_status(self) -> dict[str, Any]:
        """
        Get scheduler status.
        
        Returns:
            Status dict with running state and pending tasks
        """
        return {
            "running": self.running,
            "pending_tasks": len(self._task_map),
            "tasks": [
                {
                    "id": t.task_id,
                    "name": t.task_name,
                    "prompt": t.prompt,
                    "scheduled_for": t.scheduled_for.isoformat() if t.scheduled_for else None,
                    "priority": t.priority.name,
                    "recurrence": t.recurrence,
                }
                for t in sorted(self._task_map.values(), key=lambda x: x.scheduled_for or datetime.max)
            ]
        }


# Global scheduler instance
_scheduler: Optional[TaskScheduler] = None


def get_scheduler() -> TaskScheduler:
    """Get the global scheduler instance (singleton)."""
    global _scheduler
    if _scheduler is None:
        _scheduler = TaskScheduler()
    return _scheduler
