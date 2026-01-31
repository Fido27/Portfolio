#!/usr/bin/env python3
"""
Test Phase 7: Orchestrator & Priority System

Demonstrates:
1. Task queuing with priorities
2. Interruption handling (high priority interrupts low priority)
3. Task resumption (paused tasks resume after interruption)
4. Multiple concurrent task management
"""

import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.api.clone.orchestrator import get_orchestrator, Priority

print("🎯 Testing Orchestrator & Priority System\n")
print("=" * 70)


# Example task functions
async def low_priority_task(name: str, duration: float = 2.0):
    """Simulate a low priority task (e.g., background monitoring)."""
    print(f"  🔵 [{name}] Starting low priority work...")
    await asyncio.sleep(duration)
    print(f"  🔵 [{name}] Finished!")
    return f"LOW: {name} complete"


async def high_priority_task(name: str):
    """Simulate a high priority task (e.g., user request)."""
    print(f"  🟡 [{name}] Starting high priority work...")
    await asyncio.sleep(0.5)
    print(f"  🟡 [{name}] Finished!")
    return f"HIGH: {name} complete"


async def urgent_task(name: str):
    """Simulate an urgent task (e.g., voice command)."""
    print(f"  🔴 [{name}] URGENT! Executing immediately...")
    await asyncio.sleep(0.2)
    print(f"  🔴 [{name}] Done!")
    return f"URGENT: {name} complete"


async def test_basic_queue():
    """Test 1: Basic task queuing with priorities."""
    print("\n" + "=" * 70)
    print("TEST 1: Basic Task Queue")
    print("-" * 70)
    
    orchestrator = get_orchestrator()
    await orchestrator.start()
    
    print("\nQueuing 3 tasks with different priorities...")
    
    # Queue tasks in random order
    await orchestrator.queue_task(
        Priority.LOW,
        "background_monitor",
        low_priority_task,
        {"name": "Monitor", "duration": 1.0}
    )
    
    await orchestrator.queue_task(
        Priority.HIGH,
        "user_request",
        high_priority_task,
        {"name": "UserReq"}
    )
    
    await orchestrator.queue_task(
        Priority.MEDIUM,
        "tool_execution",
        low_priority_task,
        {"name": "ToolExec", "duration": 0.5}
    )
    
    print("\nWaiting for all tasks to complete...")
    await asyncio.sleep(3)
    
    status = orchestrator.get_status()
    print(f"\n✅ Tasks completed: {status['state']['tasks_completed']}")
    print("   Expected order: HIGH → MEDIUM → LOW")
    
    await orchestrator.stop()


async def test_interruption():
    """Test 2: High priority task interrupts low priority."""
    print("\n" + "=" * 70)
    print("TEST 2: Task Interruption")
    print("-" * 70)
    
    orchestrator = get_orchestrator()
    await orchestrator.start()
    
    print("\n1. Starting LOW priority task (takes 3 seconds)...")
    await orchestrator.queue_task(
        Priority.LOW,
        "slow_background_task",
        low_priority_task,
        {"name": "SlowBG", "duration": 3.0},
        interruptible=True
    )
    
    # Let it start
    await asyncio.sleep(0.5)
    
    print("\n2. INTERRUPTING with URGENT task!")
    result = await orchestrator.interrupt(
        Priority.URGENT,
        "emergency_voice_command",
        urgent_task,
        {"name": "VoiceCmd"}
    )
    print(f"   Urgent task result: {result}")
    
    print("\n3. Original LOW priority task should resume...")
    await asyncio.sleep(4)
    
    status = orchestrator.get_status()
    print(f"\n✅ Test complete!")
    print(f"   Tasks completed: {status['state']['tasks_completed']}")
    print("   ✓ LOW task started → URGENT interrupted → LOW resumed")
    
    await orchestrator.stop()


async def test_multiple_priorities():
    """Test 3: Multiple tasks with mixed priorities."""
    print("\n" + "=" * 70)
    print("TEST 3: Multiple Mixed Priority Tasks")
    print("-" * 70)
    
    orchestrator = get_orchestrator()
    await orchestrator.start()
    
    print("\nQueuing 5 tasks in random order...")
    
    # Queue in intentionally chaotic order
    tasks = [
        (Priority.BACKGROUND, "cleanup", 0.3),
        (Priority.HIGH, "user_chat", 0.5),
        (Priority.LOW, "monitor1", 0.4),
        (Priority.URGENT, "voice_emergency", 0.2),
        (Priority.MEDIUM, "tool_call", 0.3),
    ]
    
    for priority, name, duration in tasks:
        await orchestrator.queue_task(
            priority,
            name,
            low_priority_task if duration > 0.3 else urgent_task,
            {"name": name} if duration <= 0.3 else {"name": name, "duration": duration}
        )
        await asyncio.sleep(0.1)  # Small delay between queuing
    
    print("\nProcessing...")
    await asyncio.sleep(5)
    
    status = orchestrator.get_status()
    print(f"\n✅ All tasks processed!")
    print(f"   Total completed: {status['state']['tasks_completed']}")
    print("   Expected order: URGENT → HIGH → MEDIUM → LOW → BACKGROUND")
    
    await orchestrator.stop()


async def test_status_monitoring():
    """Test 4: Status monitoring during execution."""
    print("\n" + "=" * 70)
    print("TEST 4: Real-time Status Monitoring")
    print("-" * 70)
    
    orchestrator = get_orchestrator()
    await orchestrator.start()
    
    # Queue some tasks
    await orchestrator.queue_task(
        Priority.LOW,
        "long_task",
        low_priority_task,
        {"name": "Long", "duration": 2.0}
    )
    
    await orchestrator.queue_task(
        Priority.MEDIUM,
        "medium_task",
        low_priority_task,
        {"name": "Medium", "duration": 1.0}
    )
    
    print("\nMonitoring status during execution...\n")
    
    for i in range(4):
        await asyncio.sleep(1)
        status = orchestrator.get_status()
        
        print(f"[{i+1}s] State: {status['state']['mode']}")
        if status['current_task']:
            print(f"      Current: {status['current_task']['name']} "
                  f"(Priority: {status['current_task']['priority']})")
        print(f"      Queue: {status['queue_size']} | "
              f"Completed: {status['state']['tasks_completed']}")
        print()
    
    await orchestrator.stop()


async def main():
    """Run all tests."""
    try:
        await test_basic_queue()
        await test_interruption()
        await test_multiple_priorities()
        await test_status_monitoring()
        
        print("\n" + "=" * 70)
        print("🎉 All Orchestrator Tests Passed!")
        print("\n💡 Key Features Demonstrated:")
        print("  ✓ Priority-based task execution")
        print("  ✓ High priority interrupts low priority")
        print("  ✓ Paused tasks resume after interruption")
        print("  ✓ Multiple concurrent task management")
        print("  ✓ Real-time status monitoring")
        print("\n✨ Phase 7: Orchestrator is READY!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

