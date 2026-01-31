# ⚡ Quick Reference - Key Concepts

Quick answers to common questions about the Fido architecture.

---

## 🎯 **Your Main Questions Answered**

### **Q: How does Fido "feel alive" like Neuro-sama?**

**A: Continuous agent loops instead of request/response**

**Traditional chatbot:**
```
Wait for input → Respond → Wait for input → Respond...
```

**Fido (autonomous):**
```
while True:
    observe_context()
    decide_what_to_do()
    take_action()
    wait(short_time)
```

**Implementation:**
- Phase 8: Agent Loops
- Makes Fido proactive, not reactive
- Knows when to speak, when to stay quiet

---

### **Q: How does Fido know when to respond to Twitch chat?**

**A: LLM decides on every message**

```python
for message in chat:
    decision = await gemini.generate(
        "Should I respond to this message? Why or why not?"
    )
    
    if decision.should_respond:
        if not currently_busy():
            await respond(decision.message)
```

**Factors considered:**
- Is message directed at Fido?
- Is it interesting/funny?
- How long since last response?
- Am I busy with something else?

---

### **Q: How does Fido play games autonomously?**

**A: Continuous observe → decide → act loop**

**Minecraft example:**
```python
# User: "Get me 10 diamonds"

while diamonds < 10:
    # Observe (every 0.5 seconds)
    screenshot = capture_screen()
    health = get_health()
    mobs = detect_enemies()
    
    # Decide (LLM call)
    action = await gemini(
        "What should I do RIGHT NOW? Options: mine, move, attack, eat..."
    )
    
    # Act (immediately!)
    execute_action(action)
    
    # Check progress
    diamonds = count_inventory("diamond")
```

**Key:** Agent doesn't wait for you! It keeps working!

---

### **Q: How does Fido handle multiple things at once?**

**A: Orchestrator with priority queue**

```python
orchestrator.queue_task(priority=LOW, task=monitor_screen)
orchestrator.queue_task(priority=MEDIUM, task=play_game)
orchestrator.queue_task(priority=HIGH, task=read_donation)  # Interrupts game!
orchestrator.queue_task(priority=URGENT, task=voice_command)  # Interrupts everything!
```

**See:** Phase 7 (Orchestrator)

---

### **Q: Should I train my own LLM or just use prompting?**

**A: Just use prompting + RAG!**

**Why:**
- Gemini 2.0 is already excellent
- Training costs $100k+
- Fine-tuning costs $500-5k
- Prompting + RAG gets you 95% there for $5/month

**Only train if:**
- You have $100k+ budget
- You need something Gemini literally can't do
- You're building a commercial product

**For personal Jarvis: Prompting + RAG is perfect!**

---

### **Q: Should I use RAG or fine-tuning?**

**A: RAG! Here's why:**

| Feature | RAG | Fine-tuning |
|---------|-----|-------------|
| **Cost** | $5/month | $500-5000 |
| **Setup** | 1 day | 2-4 weeks |
| **Update data** | Instant | Retrain model |
| **Memory** | ✅ Yes! | ❌ No |
| **Flexibility** | ✅ High | ❌ Low |

**What RAG gives you:**
- "I noticed you didn't work out today"
- "Your bedroom light is entity_id light.bedroom_main"
- "You watched The Matrix last week and gave it 8/10"

**Fine-tuning gives you:**
- Consistent output format
- Very specific writing style
- (But prompting does this too!)

**Verdict: RAG is way better for your use case!**

---

### **Q: Should I connect MCP directly or through n8n?**

**A: Both! It depends:**

**Direct MCP (Python):**
```python
# Use for: Fast, simple actions
@_registry.register(...)
async def control_light(entity_id: str):
    # Direct MCP call to Home Assistant
    result = await hass_mcp.call(entity_id, "turn_on")
```

**Through n8n:**
```python
# Use for: Complex multi-step workflows
@_registry.register(...)
async def smart_home_request(request: str):
    # n8n handles: Parse → Qdrant lookup → Home Assistant
    result = await n8n_webhook.post({"request": request})
```

**Recommendation:**
- Simple HA calls → Direct MCP (faster)
- Complex workflows → n8n (easier to manage)
- You already have smart home working in n8n → Keep it there!

---

### **Q: Should this be a separate project from my portfolio?**

**A: Keep it in portfolio monorepo!**

**Why:**
- ✅ Shows full-stack skills
- ✅ Easier to maintain
- ✅ Shared dependencies
- ✅ One deployment
- ✅ Great portfolio piece

**Structure:**
```
portfolio/
├── app/
│   ├── page.tsx          # Portfolio homepage
│   ├── projects/         # Other projects
│   ├── clone/           # Fido web interface
│   └── api/clone/       # Fido core backend
│
└── services/            # Background services
    ├── voice_service.py
    ├── monitor.py
    └── twitch_bot.py
```

**Only separate if:**
- You want to distribute Fido as standalone app
- You want different tech stack
- Size becomes unmanageable (won't happen)

---

### **Q: How hard to switch from Gemini to Groq/local LLM?**

**A: Medium difficulty (1-2 weeks of work)**

**What needs to change:**

```python
# Currently: Google ADK
from google.adk.agents import LlmAgent
agent = LlmAgent(model="gemini-2.0-flash-exp", tools=tools)

# Switch to: Groq (similar)
from groq import AsyncGroq
client = AsyncGroq(api_key=GROQ_API_KEY)

# OR: Ollama (local)
from ollama import Client
client = Client()
```

**Challenges:**
1. **Tool calling format** - Each provider uses different schema
2. **Streaming format** - Different SSE formats
3. **Function calling support** - Not all models support tools well

**Best approach:**
- Create `AgentInterface` abstraction layer (see MASTER_PLAN Phase 9)
- Implement `GeminiAgent`, `GroqAgent`, `OllamaAgent`
- Switch via config

**Difficulty by model:**
- Groq: 🟢 Easy (similar to OpenAI)
- Ollama (local): 🟡 Medium (limited function calling)
- OpenAI: 🟢 Easy (standard API)
- Custom trained: 🔴 Hard (need to implement function calling)

---

## 📚 **Architecture Patterns**

### **Pattern 1: Tool Registry**

**Location:** `app/api/clone/tools.py`

**How it works:**
```python
# Register tool
@_registry.register(name="my_tool", ...)
async def my_tool(param: str):
    return {"ok": True}

# Tools automatically exposed to AI
tools = registry.get_tools_for_user(is_owner=True)
agent = LlmAgent(tools=tools)  # AI can now call my_tool!
```

---

### **Pattern 2: Autonomous Loops**

**Location:** Phase 8 (`agent_loop.py`)

**How it works:**
```python
while agent.running:
    # 1. Observe
    context = gather_context()
    
    # 2. Decide (LLM call)
    decision = await decide(context)
    
    # 3. Act
    if decision.should_act:
        await execute(decision.action)
    
    # 4. Wait (then repeat!)
    await asyncio.sleep(interval)
```

**Makes Fido:**
- Proactive (not reactive)
- Context-aware (knows what's happening)
- Autonomous (doesn't need constant input)

---

### **Pattern 3: Priority Orchestration**

**Location:** Phase 7 (`orchestrator.py`)

**How it works:**
```python
# Tasks have priorities
orchestrator.queue(priority=LOW, task=monitor_screen)
orchestrator.queue(priority=MEDIUM, task=play_game)
orchestrator.queue(priority=HIGH, task=acknowledge_donation)

# High priority interrupts low priority
# Voice commands ALWAYS get through (URGENT)
```

**Enables:**
- Multi-tasking
- Interruptions
- Smart resource allocation

---

### **Pattern 4: Event-Driven Architecture**

**Location:** Throughout system

**How it works:**
```python
# Services publish events
event_bus.publish("donation_received", {amount: 100, user: "John"})

# Orchestrator subscribes
@event_bus.on("donation_received")
async def handle_donation(data):
    await interrupt_and_thank(data)
```

**Benefits:**
- Loose coupling
- Services don't need to know about each other
- Easy to add new services

---

## 🎯 **Mental Model**

Think of your system as:

```
Fido Core (Your current backend)
    = The brain in Tony Stark's arc reactor
    
Voice Service
    = The Iron Man helmet AI
    
Activity Monitor
    = The lab sensors
    
Twitch Bot
    = The public Iron Man persona
    
Desktop Control
    = The suit's motor systems
    
Orchestrator
    = The priority management system
    
Memory (RAG)
    = JARVIS's database of everything
```

**All controlled by ONE central brain (Fido Core)!**

---

## 📖 **Common Workflows**

### **Workflow 1: Voice Command**

```
1. Voice service detects "Hey Fido"
2. Records audio
3. Converts to text (STT)
4. POSTs to Fido API: /clone/session/{id}/send
5. Fido processes (checks memory, uses tools)
6. Returns response
7. Voice service speaks it (TTS)
```

### **Workflow 2: Background Check-in**

```
1. Monitor detects: No workout for 3 days
2. Stores in daily_activities
3. Agent loop runs (every 60s)
4. Decides: "Should check in about workout"
5. Queues task (LOW priority)
6. Orchestrator executes when not busy
7. Fido speaks: "Haven't seen you workout lately, everything okay?"
```

### **Workflow 3: Donation During Game**

```
1. Playing Minecraft (MEDIUM priority)
2. Donation arrives ($100)
3. Event published (HIGH priority)
4. Orchestrator interrupts game
5. Fido speaks: "OMG! Thank you John for $100!"
6. Resumes mining after 5 seconds
```

---

## 🔑 **Key Files to Know**

| File | Purpose | When to Edit |
|------|---------|--------------|
| `tools.py` | Add new capabilities | Every new feature |
| `api.py` | Add new endpoints | New input/output modes |
| `persona.py` | Change personality | Tune behavior |
| `memory.py` | Memory system | Rarely (it just works) |
| `orchestrator.py` | Priority management | Rarely (set once) |
| `agent_loop.py` | Autonomous modes | Add new modes |

---

## 🎓 **Learning Path**

To understand the full system:

1. **Read MASTER_PLAN.md** (overall architecture)
2. **Implement Phase 1** (hands-on learning)
3. **Read PHASE_1_MEMORY.md** (detailed guide)
4. **Test thoroughly** (understand by doing)
5. **Move to Phase 2** (build incrementally)

---

## 💡 **Philosophy**

**Simple is better than complex:**
- Don't over-engineer
- Start with simplest solution
- Add complexity only when needed

**Test continuously:**
- Use Fido daily during development
- Real use reveals real problems
- Iterate based on actual experience

**Prompting > Training:**
- Modern LLMs are incredible
- Prompts are free and flexible
- Training is expensive and rigid

**Memory > Context Window:**
- RAG gives infinite memory
- Context window is limited (even 1M tokens)
- Search is faster than processing huge context

---

## 🚀 **When You're Ready**

Come back with:
```
"I'm ready to implement Phase [X]. 
Here's what I've completed: [...]
Please help me build [specific component]."
```

I'll have full context from:
- ✅ MASTER_PLAN.md
- ✅ This QUICK_REFERENCE.md
- ✅ Phase-specific guides

**Let's build your JARVIS!** 🤖✨

