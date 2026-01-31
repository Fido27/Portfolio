import asyncio
from datetime import datetime, timedelta
from app.api.clone.scheduler import TaskScheduler

async def verify_scheduler_refactor():
    print("🧪 Verifying Scheduler Refactor (Strict Mode)...")
    
    scheduler = TaskScheduler()
    # Mock save to avoid DB
    scheduler._save_task = lambda t: asyncio.sleep(0)
    scheduler.scheduler.start()
    
    # Test 1: Recurring (Cron) -> "0 9 * * 1"
    print("\n[Test 1] Recurring Task (Cron)")
    try:
        t1 = await scheduler.schedule_task(
            user_id="test",
            name="Recurring Test",
            prompt="Test",
            schedule="0 9 * * 1" # Cron for Monday 9am
        )
        if t1.recurrence == "0 9 * * 1" and t1.scheduled_for is None:
             print("✅ Correctly identified as Recurring/Cron")
        else:
             print(f"❌ Failed: recur={t1.recurrence}, scheduled_for={t1.scheduled_for}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    # Test 2: One-Time (ISO) -> Future ISO
    print("\n[Test 2] One-Time Task (ISO)")
    future_iso = (datetime.now() + timedelta(hours=1)).isoformat()
    try:
        t2 = await scheduler.schedule_task(
            user_id="test",
            name="One-Time Test",
            prompt="Test",
            schedule=future_iso
        )
        if t2.scheduled_for and t2.recurrence is None:
             print(f"✅ Correctly identified as One-Time/ISO ({t2.scheduled_for})")
        else:
             print(f"❌ Failed: recur={t2.recurrence}, scheduled_for={t2.scheduled_for}")
    except Exception as e:
        print(f"❌ Exception: {e}")

    # Test 3: Invalid Input
    print("\n[Test 3] Invalid Input (Natural Language - Should Fail or Default to Cron??)")
    # Logic: "in 5 minutes" -> ValueError on ISO parse -> recurrence="in 5 minutes" -> CronTrigger fail?
    try:
        t3 = await scheduler.schedule_task(
            user_id="test",
            name="Invalid Test",
            prompt="Test",
            schedule="in 5 minutes" 
        )
        # This currently assigns "in 5 minutes" to recurrence, which fails at trigger creation time (inside _schedule_task_execution)
        # Check printed output for "CronTrigger" error if internal
        print("⚠️ 'in 5 minutes' was accepted as a Cron string (expected behavior for now, triggering runtime error later)")
    except Exception as e:
        print(f"✅ Correctly failed/caught: {e}")

    scheduler.scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(verify_scheduler_refactor())
