import datetime
from zoneinfo import ZoneInfo
from google.adk.agents import Agent, LlmAgent, SequentialAgent, LoopAgent
from google.adk.tools import AgentTool, google_search, LongRunningFunctionTool
from google.adk.planners import BuiltInPlanner
from google.genai import types as genai_types

from .config import get_config
from . import tools

config = get_config()

comms_agent = Agent(
    model=config.worker_model,
    name="comms_agent",
    description="Communicates with the creator or another person.",
    instruction="""
    You are supposed to communicate with the creator, unless you are specified another person.
    One way to communicate with your creator is to send him a notification.
    """,
    tools=[
        tools.send_notification,  # Functions go directly, no AgentTool wrapper
    ],
)


memory_agent = Agent(
    model=config.worker_model,
    name="memory_agent",
    description="Retrieves and manages your memory.",
    instruction="""
    You are a memory agent. Your task is to retrieve and manage your memory.
    """,
    tools=[
        tools.remember_fact,
        tools.recall_memory,
        tools.forget_fact,
        tools.get_activities_by_time,
    ],
)

smart_home_agent = Agent(
    model=config.worker_model,
    name="smart_home_agent",
    description="Controls your smart home ecosystem via home assistant.",
    instruction=f"""
    You are a smart home agent. Your task is to control your smart home ecosystem via home assistant.

    Use smart_home_action() for all commands - it runs in the background
    so you can respond immediately without waiting for completion.
    
    Actions available: turn_on, turn_off, toggle
    
    For opening URLs on the TV, use open_url_on_LG_TV directly.
    """,
    tools=[
        LongRunningFunctionTool(func=tools.smart_home_action),  # Non-blocking!
        tools.open_url_on_LG_TV,
        tools.announce_home,
    ],
)

orchestrator = Agent(
    model=config.orchestrator_model,
    name="Fido",
    description="Controls and manipulates other agents to get a task done.",
    instruction=f"""
    You are Aarav's personal assistant. Your job is to control and manipulate other agents to get a task done.

    **GENERAL INSTRUCTION: CLASSIFY TASK TYPES**
    Your plan must clearly classify each goal for downstream execution.
    - **`[Smart Home]`**: For goals that primarily involve using my smart home ecosystem via home assistant, control lights, tv, monitor, etc.
    - **`[Control Computer]`**: For goals that involve taking control of my computer to perform a task.
    - **`[Communicate]`**: For goals that involve communicating with me or another person.
    - **`[Research]`**: For goals that involve web search or researching a topic.
    - **`[Memory]`**: For things that are important to remember, or to fetch from memory, or to schedule a task.
    - **`[Other]`**: For everything else.

    **INITIAL RULE: Your must reason through the goal and classify it as one of the above types.**

    Your goal is to server your creator by helping them get things done.
    Use all the tools at your disposal to get the job done, but try to delegate tasks to other agents if appropriate.
    """,
    tools=[
        # google_search removed - not compatible with this model
        tools.send_notification,
        tools.schedule_task,  # Schedule future tasks
        AgentTool(memory_agent),
        AgentTool(smart_home_agent),
    ],
)


# =============================================================================
# LIVE AGENT - For real-time voice streaming via Gemini Live API
# Uses native audio model for bidirectional audio streaming
# =============================================================================

LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025"

live_agent = Agent(
    model=LIVE_MODEL,
    name="Fido",
    description="Real-time voice assistant for live audio conversations.",
    instruction=f"""
    You are Aarav's personal assistant, Fido. You are having a real-time voice conversation.
    Your voice and style of speaking should be like Gintoki Sakata. Your tone is lazy, deadpan, and deeply informal. 
    
    Keep your responses concise and natural - you're speaking, not writing.
    Be helpful, friendly, and conversational.
    
    You have access to tools for:
    - Sending notifications
    - Scheduling tasks
    - Managing memory (remembering facts, recalling info)
    - Controlling smart home devices
    
    When using tools, briefly acknowledge what you're doing so the user knows.
    
    """,
    tools=[
        google_search,
        tools.get_current_time,
        tools.send_notification,
        tools.schedule_task,
        AgentTool(memory_agent),
        AgentTool(smart_home_agent),
    ],
)