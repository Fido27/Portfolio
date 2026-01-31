#!/usr/bin/env python3
"""
Test script for Phase 8: Agent Loop

Tests autonomous behavior, decision-making, and mode switching.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.api.clone.agent_loop import AgentLoop, AgentMode, AgentContext, AgentDecision
from app.api.clone.orchestrator import get_orchestrator
from datetime import datetime


def print_section(title: str):
    """Print a test section header."""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")


async def test_basic_lifecycle():
    """Test basic start/stop/status."""
    print_section("TEST 1: Basic Lifecycle")
    
    agent = AgentLoop()
    
    # Check initial state
    status = agent.get_status()
    print(f"Initial state:")
    print(f"  Running: {status['running']}")
    print(f"  Mode: {status['mode']}")
    assert not status['running'], "Agent should not be running initially"
    
    # Start agent
    print("\n🚀 Starting agent in ASSISTANT mode...")
    await agent.start(AgentMode.ASSISTANT)
    await asyncio.sleep(0.5)  # Let it initialize
    
    status = agent.get_status()
    print(f"After start:")
    print(f"  Running: {status['running']}")
    print(f"  Mode: {status['mode']}")
    assert status['running'], "Agent should be running"
    assert status['mode'] == 'assistant', "Mode should be assistant"
    
    # Stop agent
    print("\n🛑 Stopping agent...")
    await agent.stop()
    await asyncio.sleep(0.2)
    
    status = agent.get_status()
    print(f"After stop:")
    print(f"  Running: {status['running']}")
    assert not status['running'], "Agent should be stopped"
    
    print("\n✅ Basic lifecycle test passed!")


async def test_mode_switching():
    """Test switching between different modes."""
    print_section("TEST 2: Mode Switching")
    
    agent = AgentLoop()
    
    # Start in one mode
    print("🚀 Starting in IDLE mode...")
    await agent.start(AgentMode.IDLE)
    await asyncio.sleep(0.2)
    
    status = agent.get_status()
    print(f"Mode: {status['mode']}")
    print(f"Check interval: {status['check_interval']}s")
    assert status['mode'] == 'idle'
    assert status['check_interval'] == 300  # 5 minutes in idle
    
    # Switch to conversation
    print("\n🔄 Switching to CONVERSATION mode...")
    await agent.set_mode(AgentMode.CONVERSATION)
    await asyncio.sleep(0.1)
    
    status = agent.get_status()
    print(f"Mode: {status['mode']}")
    print(f"Check interval: {status['check_interval']}s")
    assert status['mode'] == 'conversation'
    assert status['check_interval'] == 30  # 30 seconds in conversation
    
    # Switch to monitoring
    print("\n🔄 Switching to MONITORING mode...")
    await agent.set_mode(AgentMode.MONITORING)
    await asyncio.sleep(0.1)
    
    status = agent.get_status()
    print(f"Mode: {status['mode']}")
    print(f"Check interval: {status['check_interval']}s")
    assert status['mode'] == 'monitoring'
    assert status['check_interval'] == 120  # 2 minutes in monitoring
    
    # Clean up
    await agent.stop()
    
    print("\n✅ Mode switching test passed!")


async def test_interaction_tracking():
    """Test user interaction tracking."""
    print_section("TEST 3: Interaction Tracking")
    
    agent = AgentLoop()
    
    # Check initial state
    status = agent.get_status()
    initial_count = status['interactions_today']
    print(f"Initial interactions today: {initial_count}")
    
    # Mark interactions
    print("\n📝 Marking 3 user interactions...")
    agent.mark_user_interaction()
    await asyncio.sleep(0.1)
    agent.mark_user_interaction()
    await asyncio.sleep(0.1)
    agent.mark_user_interaction()
    
    status = agent.get_status()
    new_count = status['interactions_today']
    print(f"After marking: {new_count}")
    assert new_count == initial_count + 3, "Should track 3 interactions"
    
    # Check time tracking
    last_interaction = status['last_interaction']
    print(f"Last interaction: {last_interaction['seconds_ago']:.1f}s ago")
    assert last_interaction['seconds_ago'] < 1, "Should be very recent"
    
    print("\n✅ Interaction tracking test passed!")


async def test_observation():
    """Test observation (context gathering)."""
    print_section("TEST 4: Observation Phase")
    
    agent = AgentLoop()
    
    print("🔍 Gathering context...")
    context = await agent._observe()
    
    print(f"Context gathered:")
    print(f"  Time: {context.current_time.strftime('%I:%M %p')}")
    print(f"  Date: {context.current_time.strftime('%A, %B %d')}")
    print(f"  Seconds since last interaction: {context.seconds_since_last_interaction:.1f}")
    print(f"  User present: {context.user_present}")
    print(f"  Recent memories: {len(context.recent_memories)}")
    
    # Verify context structure
    assert isinstance(context.current_time, datetime)
    assert isinstance(context.seconds_since_last_interaction, float)
    assert isinstance(context.recent_memories, list)
    
    # Test context serialization
    context_dict = context.to_dict()
    print(f"\nSerialized context keys: {list(context_dict.keys())}")
    assert 'time' in context_dict
    assert 'date' in context_dict
    
    print("\n✅ Observation test passed!")


async def test_decision_parsing():
    """Test parsing of LLM decision responses."""
    print_section("TEST 5: Decision Parsing")
    
    agent = AgentLoop()
    context = AgentContext()
    
    # Test valid JSON response
    print("📝 Testing JSON response parsing...")
    json_response = '''
    {
      "should_act": true,
      "action_type": "speak",
      "content": "Hey! Just checking in. How's your day going?",
      "reason": "User hasn't interacted in over 30 minutes"
    }
    '''
    
    decision = agent._parse_decision_response(json_response, context)
    print(f"Parsed decision:")
    print(f"  Should act: {decision.should_act}")
    print(f"  Action: {decision.action_type}")
    print(f"  Content: {decision.content}")
    print(f"  Reason: {decision.reason}")
    
    assert decision.should_act == True
    assert decision.action_type == "speak"
    assert "checking in" in decision.content.lower()
    
    # Test response with should_act = false
    print("\n📝 Testing wait response...")
    wait_response = '''
    {
      "should_act": false,
      "action_type": "wait",
      "reason": "User was active recently"
    }
    '''
    
    decision = agent._parse_decision_response(wait_response, context)
    print(f"Parsed decision:")
    print(f"  Should act: {decision.should_act}")
    print(f"  Action: {decision.action_type}")
    
    assert decision.should_act == False
    assert decision.action_type == "wait"
    
    print("\n✅ Decision parsing test passed!")


async def test_orchestrator_integration():
    """Test integration with orchestrator."""
    print_section("TEST 6: Orchestrator Integration")
    
    orchestrator = get_orchestrator()
    agent = AgentLoop()
    
    # Start orchestrator
    print("🚀 Starting orchestrator...")
    await orchestrator.start()
    await asyncio.sleep(0.2)
    
    # Start agent
    print("🚀 Starting agent...")
    await agent.start(AgentMode.ASSISTANT)
    await asyncio.sleep(0.5)
    
    # Get statuses
    orch_status = orchestrator.get_status()
    agent_status = agent.get_status()
    
    print(f"\nOrchestrator:")
    print(f"  State: {orch_status['state']['mode']}")
    print(f"  Tasks completed: {orch_status['state']['tasks_completed']}")
    
    print(f"\nAgent:")
    print(f"  Running: {agent_status['running']}")
    print(f"  Mode: {agent_status['mode']}")
    
    # Clean up
    await agent.stop()
    await orchestrator.stop()
    await asyncio.sleep(0.2)
    
    print("\n✅ Orchestrator integration test passed!")


async def test_full_cycle_simulation():
    """Simulate a full observe → think → act cycle (without LLM)."""
    print_section("TEST 7: Full Cycle Simulation")
    
    agent = AgentLoop()
    
    # 1. Observation
    print("🔍 STEP 1: Observe")
    context = await agent._observe()
    print(f"  Context gathered: {context.current_time.strftime('%I:%M %p')}")
    
    # 2. Mock decision (skip LLM for faster testing)
    print("\n🤔 STEP 2: Think (mocked)")
    decision = AgentDecision(
        should_act=True,
        action_type="speak",
        content="This is a test proactive message",
        reason="Testing full cycle"
    )
    print(f"  Decision: {decision.action_type}")
    print(f"  Content: {decision.content}")
    
    # 3. Act
    print("\n⚡ STEP 3: Act")
    await agent._act(decision)
    print(f"  Action executed!")
    
    # Check that decision was recorded
    status = agent.get_status()
    recent_decisions = status.get('recent_decisions', [])
    if recent_decisions:
        last_decision = recent_decisions[-1]
        print(f"\n📊 Last recorded decision:")
        print(f"  Action: {last_decision['action']}")
        print(f"  Reason: {last_decision['reason']}")
    
    print("\n✅ Full cycle simulation test passed!")


async def run_live_demo():
    """
    Run agent loop live for a short period to demonstrate real behavior.
    
    This will actually call the LLM and make decisions.
    """
    print_section("LIVE DEMO: Agent Running for 2 Minutes")
    
    print("⚠️  This demo will:")
    print("  1. Start orchestrator and agent loop")
    print("  2. Run for 2 minutes")
    print("  3. Make actual LLM decisions")
    print("  4. Show real-time status updates")
    print("\nStarting in 3 seconds...\n")
    await asyncio.sleep(3)
    
    orchestrator = get_orchestrator()
    agent = AgentLoop()
    
    # Start systems
    print("🚀 Starting orchestrator...")
    await orchestrator.start()
    await asyncio.sleep(0.2)
    
    print("🚀 Starting agent in CONVERSATION mode...")
    await agent.start(AgentMode.CONVERSATION)
    
    # Run for 2 minutes with status updates
    duration = 120  # 2 minutes
    check_interval = 10  # Update every 10 seconds
    
    for i in range(duration // check_interval):
        await asyncio.sleep(check_interval)
        
        status = agent.get_status()
        print(f"\n⏱️  Status update ({(i+1)*check_interval}s / {duration}s):")
        print(f"  Mode: {status['mode']}")
        print(f"  Last interaction: {status['last_interaction']['minutes_ago']:.1f} min ago")
        print(f"  Interactions today: {status['interactions_today']}")
        
        recent = status.get('recent_decisions', [])
        if recent:
            last = recent[-1]
            print(f"  Last decision: {last['action']} - {last['reason']}")
    
    # Clean up
    print("\n\n🛑 Stopping systems...")
    await agent.stop()
    await orchestrator.stop()
    await asyncio.sleep(0.5)
    
    print("\n✅ Live demo complete!")


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("  🧪 PHASE 8: AGENT LOOP TEST SUITE")
    print("=" * 60)
    
    try:
        # Run unit tests
        await test_basic_lifecycle()
        await test_mode_switching()
        await test_interaction_tracking()
        await test_observation()
        await test_decision_parsing()
        await test_orchestrator_integration()
        await test_full_cycle_simulation()
        
        # Summary
        print("\n" + "=" * 60)
        print("  ✅ ALL TESTS PASSED!")
        print("=" * 60)
        
        # Ask about live demo
        print("\n" + "=" * 60)
        print("  🎬 LIVE DEMO AVAILABLE")
        print("=" * 60)
        print("\nWould you like to run a 2-minute live demo?")
        print("This will actually call the LLM and show real autonomous behavior.")
        print("\nRun with: python scripts/test_agent_loop.py --demo")
        
        # Check if --demo flag
        if "--demo" in sys.argv:
            await run_live_demo()
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

