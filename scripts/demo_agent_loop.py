#!/usr/bin/env python3
"""
Interactive Demo for Phase 8: Agent Loop

Shows autonomous behavior in real-time with user controls.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.api.clone.agent_loop import get_agent_loop, AgentMode
from app.api.clone.orchestrator import get_orchestrator


def print_header():
    """Print demo header."""
    print("\n" + "=" * 70)
    print("  🤖 FIDO AI - AUTONOMOUS AGENT LOOP DEMO")
    print("  Phase 8: Making Fido Feel Alive")
    print("=" * 70)


def print_menu():
    """Print available commands."""
    print("\n" + "-" * 70)
    print("  COMMANDS:")
    print("-" * 70)
    print("  start [mode]  - Start agent (modes: idle, assistant, conversation, monitoring)")
    print("  stop          - Stop agent")
    print("  mode <mode>   - Change mode")
    print("  status        - Show current status")
    print("  interact      - Mark user interaction (simulates sending a message)")
    print("  help          - Show this menu")
    print("  quit          - Exit demo")
    print("-" * 70)


async def handle_start(agent, parts):
    """Handle start command."""
    mode = parts[1] if len(parts) > 1 else "assistant"
    
    try:
        agent_mode = AgentMode(mode)
    except ValueError:
        print(f"❌ Invalid mode: {mode}")
        print(f"   Valid modes: {', '.join([m.value for m in AgentMode])}")
        return
    
    print(f"🚀 Starting agent in {mode.upper()} mode...")
    await agent.start(agent_mode)
    await asyncio.sleep(0.3)
    print(f"✅ Agent running!")


async def handle_stop(agent):
    """Handle stop command."""
    print("🛑 Stopping agent...")
    await agent.stop()
    await asyncio.sleep(0.2)
    print("✅ Agent stopped")


async def handle_mode(agent, parts):
    """Handle mode change command."""
    if len(parts) < 2:
        print("❌ Usage: mode <mode_name>")
        return
    
    mode = parts[1]
    try:
        agent_mode = AgentMode(mode)
    except ValueError:
        print(f"❌ Invalid mode: {mode}")
        return
    
    print(f"🔄 Changing to {mode.upper()} mode...")
    await agent.set_mode(agent_mode)
    print(f"✅ Mode changed!")


def handle_status(agent):
    """Handle status command."""
    status = agent.get_status()
    
    print("\n" + "=" * 70)
    print("  📊 AGENT STATUS")
    print("=" * 70)
    print(f"  Running: {status['running']}")
    print(f"  Mode: {status['mode'].upper()}")
    print(f"  Check interval: {status['check_interval']}s")
    print(f"  Min gap between actions: {status['min_interaction_gap']}s")
    print()
    print(f"  Last interaction:")
    print(f"    - {status['last_interaction']['minutes_ago']:.1f} minutes ago")
    print(f"    - {status['last_interaction']['seconds_ago']:.1f} seconds ago")
    print()
    print(f"  Interactions today: {status['interactions_today']}")
    print()
    
    recent = status.get('recent_decisions', [])
    if recent:
        print(f"  Recent decisions ({len(recent)}):")
        for i, decision in enumerate(recent[-5:], 1):
            print(f"    {i}. {decision['action']}: {decision['reason']}")
    else:
        print(f"  Recent decisions: None yet")
    
    if status.get('context'):
        print()
        print(f"  Current context:")
        ctx = status['context']
        print(f"    - Time: {ctx['time']}")
        print(f"    - Date: {ctx['date']}")
        print(f"    - Memories loaded: {len(ctx['recent_memories'])}")
    
    print("=" * 70)


def handle_interact(agent):
    """Handle interaction command."""
    print("📝 Marking user interaction...")
    agent.mark_user_interaction()
    print("✅ Interaction recorded!")
    print("   (Agent won't proactively reach out for a while)")


async def status_monitor_loop(agent):
    """Background task to show live status updates."""
    while True:
        await asyncio.sleep(30)  # Update every 30 seconds
        
        status = agent.get_status()
        if status['running']:
            print("\n" + "-" * 70)
            print(f"  🔄 AUTO-UPDATE: Agent running in {status['mode'].upper()} mode")
            print(f"     Last interaction: {status['last_interaction']['minutes_ago']:.1f} min ago")
            recent = status.get('recent_decisions', [])
            if recent:
                last = recent[-1]
                print(f"     Last decision: {last['action']} - {last['reason']}")
            print("-" * 70)


async def command_loop(agent):
    """Main command loop."""
    print_header()
    print("\n👋 Welcome to the Agent Loop Demo!")
    print("\nThis demo lets you control Fido's autonomous behavior in real-time.")
    print("The agent will observe, think, and decide when to act - just like JARVIS!")
    print_menu()
    
    while True:
        try:
            # Get user input
            user_input = await asyncio.to_thread(input, "\n🎮 Command: ")
            user_input = user_input.strip().lower()
            
            if not user_input:
                continue
            
            parts = user_input.split()
            command = parts[0]
            
            # Handle commands
            if command == "quit" or command == "exit":
                print("\n👋 Shutting down...")
                await agent.stop()
                break
            
            elif command == "start":
                await handle_start(agent, parts)
            
            elif command == "stop":
                await handle_stop(agent)
            
            elif command == "mode":
                await handle_mode(agent, parts)
            
            elif command == "status":
                handle_status(agent)
            
            elif command == "interact":
                handle_interact(agent)
            
            elif command == "help":
                print_menu()
            
            else:
                print(f"❌ Unknown command: {command}")
                print("   Type 'help' for available commands")
        
        except KeyboardInterrupt:
            print("\n\n👋 Ctrl+C detected. Shutting down...")
            await agent.stop()
            break
        except EOFError:
            print("\n\n👋 EOF detected. Shutting down...")
            await agent.stop()
            break
        except Exception as e:
            print(f"❌ Error: {e}")


async def main():
    """Run the demo."""
    # Initialize systems
    orchestrator = get_orchestrator()
    agent = get_agent_loop()
    
    # Start orchestrator (needed for agent actions)
    print("🚀 Starting orchestrator...")
    await orchestrator.start()
    await asyncio.sleep(0.3)
    
    # Start status monitor in background
    monitor_task = asyncio.create_task(status_monitor_loop(agent))
    
    try:
        # Run command loop
        await command_loop(agent)
    finally:
        # Clean up
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass
        
        await orchestrator.stop()
        print("\n✅ Demo complete. Goodbye!")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")

