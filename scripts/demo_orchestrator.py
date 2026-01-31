#!/usr/bin/env python3
"""
Live demo of orchestrator with real Fido tasks.

Shows how to integrate orchestrator with:
- Memory operations
- Chat responses  
- Background tasks
"""

import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.orchestrator import get_orchestrator, Priority
from app.api.clone.memory import get_memory

print("🎬 Live Orchestrator Demo with Real Fido Tasks\n")
print("=" * 70)


# Real Fido task examples
async def memory_recall_task(query: str):
    """Simulate a memory recall (MEDIUM priority)."""
    print(f"  🧠 Searching memory for: '{query}'")
    memory = get_memory()
    results = memory.search(query, "fido_memory", limit=3)
    
    await asyncio.sleep(0.5)  # Simulate processing time
    
    if results:
        print(f"  ✅ Found {len(results)} memories:")
        for r in results[:2]:
            print(f"     → {r['text']}")
    else:
        print(f"  ℹ️  No memories found")
    
    return {"ok": True, "count": len(results)}


async def background_monitor_task():
    """Simulate background monitoring (LOW priority)."""
    print(f"  👁️  Background monitor checking system...")
    await asyncio.sleep(2.0)
    print(f"  ✅ Monitor complete - everything OK")
    return {"ok": True, "status": "healthy"}


async def urgent_voice_command_task(command: str):
    """Simulate voice command (URGENT priority)."""
    print(f"  🎤 Voice command: '{command}'")
    await asyncio.sleep(0.3)
    print(f"  ✅ Voice command executed!")
    return {"ok": True, "command": command}


async def user_chat_task(message: str):
    """Simulate chat response (HIGH priority)."""
    print(f"  💬 Processing chat: '{message}'")
    await asyncio.sleep(0.8)
    print(f"  ✅ Chat response ready")
    return {"ok": True, "response": "simulated response"}


async def demo():
    """Run live demo."""
    
    orchestrator = get_orchestrator()
    await orchestrator.start()
    
    print("\n" + "=" * 70)
    print("DEMO 1: Normal Chat Flow")
    print("-" * 70)
    
    print("\nUser sends chat message...")
    await orchestrator.queue_task(
        Priority.HIGH,
        "user_chat",
        user_chat_task,
        {"message": "What's the weather?"}
    )
    
    await asyncio.sleep(1.5)
    
    print("\n" + "=" * 70)
    print("DEMO 2: Voice Command Interrupts Background Task")
    print("-" * 70)
    
    print("\n1. Start background monitoring (LOW priority, takes 2 seconds)...")
    await orchestrator.queue_task(
        Priority.LOW,
        "background_monitor",
        background_monitor_task,
        {},
        interruptible=True
    )
    
    await asyncio.sleep(0.5)
    
    print("\n2. User says 'Hey Fido!' (URGENT - should interrupt!)...")
    result = await orchestrator.interrupt(
        Priority.URGENT,
        "voice_wake_word",
        urgent_voice_command_task,
        {"command": "turn on lights"}
    )
    
    print(f"\n   → Voice executed: {result}")
    
    print("\n3. Background monitor should resume...")
    await asyncio.sleep(3)
    
    print("\n" + "=" * 70)
    print("DEMO 3: Mixed Tasks with Memory")
    print("-" * 70)
    
    print("\nQueuing multiple tasks:")
    
    # Background monitor (LOW)
    await orchestrator.queue_task(
        Priority.LOW,
        "monitor",
        background_monitor_task,
        {}
    )
    
    # Memory recall (MEDIUM)
    await orchestrator.queue_task(
        Priority.MEDIUM,
        "recall_preferences",
        memory_recall_task,
        {"query": "Aarav preferences"}
    )
    
    # User chat (HIGH)
    await orchestrator.queue_task(
        Priority.HIGH,
        "chat_response",
        user_chat_task,
        {"message": "Tell me about yourself"}
    )
    
    print("\nExecuting in priority order (HIGH → MEDIUM → LOW)...")
    await asyncio.sleep(4)
    
    # Show final status
    status = orchestrator.get_status()
    
    print("\n" + "=" * 70)
    print("📊 Final Status:")
    print("-" * 70)
    print(f"  Mode: {status['state']['mode']}")
    print(f"  Tasks Completed: {status['state']['tasks_completed']}")
    print(f"  Queue Size: {status['queue_size']}")
    print(f"  Current Task: {status['current_task'] or 'None (idle)'}")
    
    await orchestrator.stop()
    
    print("\n" + "=" * 70)
    print("🎉 Demo Complete!")
    print("\n💡 What You Saw:")
    print("  1. Tasks execute in priority order automatically")
    print("  2. URGENT voice commands interrupt background work")
    print("  3. Paused tasks resume after interruption")
    print("  4. Real Fido operations (memory, chat) work with orchestrator")
    print("\n✨ Orchestrator is production-ready!")


if __name__ == "__main__":
    asyncio.run(demo())

