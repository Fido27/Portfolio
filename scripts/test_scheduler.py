#!/usr/bin/env python3
"""
Test the scheduler by creating a task programmatically.
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

async def test_scheduler():
    from app.api.clone.scheduler import get_scheduler
    from app.api.clone.orchestrator import Priority
    
    scheduler = get_scheduler()
    
    # Start if not running
    if not scheduler.running:
        await scheduler.start()
        print("✅ Scheduler started")
    else:
        print("ℹ️  Scheduler already running")
    
    # Schedule a test task for 10 seconds from now
    print("\n📅 Scheduling test task for 10 seconds from now...")
    
    task_id = await scheduler.schedule_task(
        user_id="owner",
        name="Test notification",
        action="send_notification",
        run_at="in 10 seconds",
        priority=Priority.MEDIUM,
        args={"message": "🎉 Scheduler test successful!", "title": "Fido Scheduler"}
    )
    
    print(f"✅ Task scheduled: {task_id}")
    
    # Check status
    status = scheduler.get_status()
    print(f"\n📊 Scheduler status:")
    print(f"   Running: {status['running']}")
    print(f"   Pending tasks: {status['pending_tasks']}")
    
    if status['tasks']:
        print(f"\n📋 Scheduled tasks:")
        for task in status['tasks']:
            print(f"   - {task['name']} at {task['scheduled_for']}")
    
    print("\n⏳ Waiting 12 seconds for task to execute...")
    await asyncio.sleep(12)
    
    # Check if task executed
    status = scheduler.get_status()
    print(f"\n📊 After execution:")
    print(f"   Pending tasks: {status['pending_tasks']}")
    
    if status['pending_tasks'] == 0:
        print("\n✅ Test passed! Task was executed and removed from queue.")
    else:
        print("\n⚠️  Task still pending - check if orchestrator is running")

if __name__ == "__main__":
    asyncio.run(test_scheduler())
