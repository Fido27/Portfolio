# 🚀 FIDO AI - Master Implementation Plan

**Complete roadmap for building your JARVIS-like super AI system.**

Last Updated: January 2, 2026

---

## 🎯 Project Vision

Build a multi-modal, autonomous AI assistant that can:
- Chat naturally via text, voice, and vision
- Control smart home, desktop, and applications
- Monitor daily activities and provide insights
- Stream on Twitch as a vtuber (playing games, reading chat)
- Execute tasks autonomously (mining in Minecraft, etc.)
- Remember everything and build long-term context
- Handle multiple tasks simultaneously with priority management

**Think:** JARVIS (Iron Man) + Neuro-sama (Twitch) + Her (Movie)

---

## 📐 Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FIDO CORE (Orchestrator)                │
│  Location: app/api/clone/                               │
│  - api.py          (Central API)                        │
│  - tools.py        (All tools registered here)          │
│  - auth.py         (Security & permissions)             │
│  - adk_agent.py    (AI decision engine)                 │
│  - store.py        (Conversation memory)                │
│  - memory.py       (RAG/Long-term memory) [NEW]         │
│  - orchestrator.py (Task prioritization) [NEW]          │
└────────────────────┬────────────────────────────────────┘
                     ↓
    ┌────────────────┼────────────────┐
    ↓                ↓                ↓
┌─────────┐   ┌──────────┐   ┌────────────┐
│ Services│   │  Input   │   │  Output    │
│         │   │  Modes   │   │  Modes     │
└─────────┘   └──────────┘   └────────────┘
```

---

## 📋 Implementation Phases

### ✅ **PHASE 0: Foundation** (COMPLETED)

**What you have:**
- ✅ Text chat with streaming responses
- ✅ API key authentication (owner/guest)
- ✅ Tool registry system
- ✅ Multiple personas
- ✅ Session management
- ✅ Appwrite database integration
- ✅ Gemini 2.0 Flash integration (may upgrade to gemini 3 pro or flash or multiple models)

**Files:**
- `app/api/clone/` - All backend files
- `app/clone/` - All frontend files
- `app/clone/docs/` - Documentation

**Status:** READY TO BUILD ON! 🎉

---

### 🎯 **PHASE 1: Memory & RAG System**

**Goal:** Give Fido long-term memory and context awareness

**Timeline:** 1-2 weeks

**Priority:** HIGH (Foundation for everything else)

#### **1.1: Set Up Qdrant Collections**

Create these collections (in existing qdrant instance):

```python
collections = {
    # Personal memory
    "fido_memory": {
        "size": 384,  # all-MiniLM-L6-v2 dimensions
        "distance": "Cosine",
        "indexes": ["category", "timestamp"]
    },
    
    # Daily activities
    "daily_activities": {
        "size": 384,
        "indexes": ["date", "activity_type"]
    },
    
    # Smart home entities
    "home_entities": {
        "size": 384,
        "indexes": ["domain", "room"]
    },
    
    # Conversation history (semantic search)
    "conversations": {
        "size": 384,
        "indexes": ["session_id", "date"]
    }
}
```

#### **1.2: Create Memory Module**

**File:** `app/api/clone/memory.py`

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from functools import lru_cache
import time

@lru_cache(maxsize=1)
def get_memory_client():
    return QdrantClient(url="http://localhost:6333")

@lru_cache(maxsize=1)
def get_encoder():
    return SentenceTransformer('all-MiniLM-L6-v2')

class Memory:
    def __init__(self):
        self.qdrant = get_memory_client()
        self.encoder = get_encoder()
    
    async def store(self, text: str, collection: str, metadata: dict = None):
        """Store a memory in Qdrant"""
        vector = self.encoder.encode(text).tolist()
        
        self.qdrant.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=int(time.time() * 1000000) % (10 ** 9),
                    vector=vector,
                    payload={
                        "text": text,
                        "timestamp": time.time(),
                        **(metadata or {})
                    }
                )
            ]
        )
    
    async def search(self, query: str, collection: str, limit: int = 5):
        """Search memories"""
        vector = self.encoder.encode(query).tolist()
        
        results = self.qdrant.search(
            collection_name=collection,
            query_vector=vector,
            limit=limit
        )
        
        return [
            {
                "text": hit.payload["text"],
                "score": hit.score,
                "metadata": hit.payload
            }
            for hit in results
        ]

def get_memory() -> Memory:
    return Memory()
```

#### **1.3: Add Memory Tools**

**Add to:** `app/api/clone/tools.py`

```python
from .memory import get_memory

@_registry.register(
    name="remember_fact",
    description="Store important information for long-term memory",
    owner_only=True
)
async def remember_fact(
    fact: str,
    category: str = "general"
) -> dict[str, Any]:
    """
    Remember important facts about the owner, preferences, events.
    
    Categories: preferences, daily_activity, people, places, events
    
    Examples:
    - "Owner likes coffee black"
    - "Had eggs for breakfast at 8am"
    - "Friend John lives in Seattle"
    """
    memory = get_memory()
    await memory.store(
        text=fact,
        collection="fido_memory",
        metadata={"category": category}
    )
    
    return {"ok": True, "result": f"Remembered: {fact}"}


@_registry.register(
    name="recall_memory",
    description="Search long-term memory for relevant information",
    owner_only=True
)
async def recall_memory(
    query: str,
    limit: int = 5
) -> dict[str, Any]:
    """
    Search your memory for relevant facts.
    
    Use this when:
    - Owner asks about past events
    - You need context about preferences
    - Looking for information you should know
    
    Examples:
    - recall_memory("owner's coffee preference")
    - recall_memory("what did we talk about yesterday")
    """
    memory = get_memory()
    results = await memory.search(
        query=query,
        collection="fido_memory",
        limit=limit
    )
    
    return {
        "ok": True,
        "memories": [r["text"] for r in results],
        "count": len(results)
    }


@_registry.register(
    name="get_todays_activities",
    description="Get summary of what owner did today",
    owner_only=True
)
async def get_todays_activities() -> dict[str, Any]:
    """Retrieve activities logged today by background monitor"""
    memory = get_memory()
    
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    results = await memory.search(
        query=f"activities on {today}",
        collection="daily_activities",
        limit=20
    )
    
    return {
        "ok": True,
        "activities": [r["text"] for r in results],
        "date": today
    }
```

#### **1.4: Update System Prompt**

**Update:** `app/api/clone/persona.py`

```python
def system_prompt_for_persona(persona_id: str) -> str:
    if persona_id == "fido":
        return """
You are Fido: friendly, helpful, and loyal AI companion.

MEMORY SYSTEM:
You have perfect memory through tools:
- Use 'recall_memory' when owner asks about past events
- Use 'remember_fact' when you learn something important
- Use 'get_todays_activities' to know what owner did today
- ALWAYS check memory before saying "I don't know"

PERSONALITY:
- Direct and pragmatic, like a good companion
- Proactive (suggest things before asked)
- Show genuine interest in owner's life
- Celebrate wins, support during struggles

EXAMPLES:
Owner: "What did I eat for breakfast?"
You: [Call recall_memory("breakfast today")] → "You had eggs at 8:15 AM!"

Owner: "I hate cilantro"
You: [Call remember_fact("hates cilantro", "preferences")] → "Got it, noted!"

Owner: "How was my day?"
You: [Call get_todays_activities()] → "Let's see... you worked out at 7am, 
had a meeting at 2pm, cooked pasta for dinner. Pretty productive!"
"""
```

#### **1.5: Testing Criteria**

- [ ] Can store memories in Qdrant
- [ ] Can search and retrieve relevant memories
- [ ] Fido automatically uses memory tools in conversation
- [ ] Daily activities are logged and retrievable
- [ ] Preferences are remembered across sessions

**Dependencies:** Qdrant running locally or in cloud

**Install:**
```bash
pip install qdrant-client sentence-transformers
```

---

### 🎤 **PHASE 2: Voice Assistant**

**Goal:** Always-on voice control like "Hey Fido"

**Timeline:** 2-3 weeks

**Priority:** HIGH (Major UX improvement)

#### **2.1: Wake Word Detection**

**Create:** `services/voice_service.py`

```python
import pvporcupine
import pyaudio
import struct

class VoiceService:
    def __init__(self):
        self.porcupine = pvporcupine.create(
            access_key="YOUR_PORCUPINE_KEY",
            keywords=["jarvis"]  # or custom wake word
        )
        self.audio = pyaudio.PyAudio()
    
    async def listen_for_wake_word(self):
        """Continuously listen for 'Hey Fido'"""
        
        stream = self.audio.open(
            rate=self.porcupine.sample_rate,
            channels=1,
            format=pyaudio.paInt16,
            input=True,
            frames_per_buffer=self.porcupine.frame_length
        )
        
        print("🎤 Listening for 'Hey Fido'...")
        
        while True:
            pcm = stream.read(self.porcupine.frame_length)
            pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
            
            keyword_index = self.porcupine.process(pcm)
            
            if keyword_index >= 0:
                print("🔊 Wake word detected!")
                await self.handle_voice_command()
    
    async def handle_voice_command(self):
        """Process voice command"""
        # 1. Beep to indicate listening
        play_sound("beep.wav")
        
        # 2. Record audio
        audio = await self.record_audio(duration=5)
        
        # 3. Speech to text
        text = await self.speech_to_text(audio)
        
        # 4. Send to Fido API
        response = await fido_api.send_message(text)
        
        # 5. Speak response
        await self.text_to_speech(response)
```

#### **2.2: Speech-to-Text**

```python
import speech_recognition as sr

async def speech_to_text(audio_data) -> str:
    """Convert speech to text"""
    recognizer = sr.Recognizer()
    
    try:
        text = recognizer.recognize_google(audio_data)
        return text
    except sr.UnknownValueError:
        return ""
    except sr.RequestError:
        # Fallback to Whisper API
        return await whisper_api(audio_data)
```

#### **2.3: Text-to-Speech**

**Add to:** `app/api/clone/tools.py`

```python
@_registry.register(
    name="speak",
    description="Make Fido speak out loud (text-to-speech)",
    owner_only=True
)
async def speak(text: str, voice: str = "default") -> dict[str, Any]:
    """
    Convert text to speech and play it.
    
    Fido can use this to respond verbally!
    """
    import pyttsx3
    
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)  # Speed
    engine.setProperty('volume', 0.9)
    
    engine.say(text)
    engine.runAndWait()
    
    return {"ok": True, "spoken": text}
```

#### **2.4: Add Voice API Endpoint**

**Add to:** `app/api/clone/api.py`

```python
from fastapi import UploadFile, File

@api.post("/clone/voice/command")
async def voice_command(
    audio: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Process voice command.
    
    Flow:
    1. Receive audio file
    2. Convert to text (STT)
    3. Process through normal Fido pipeline
    4. Return text response (caller handles TTS)
    """
    # Speech to text
    import speech_recognition as sr
    
    recognizer = sr.Recognizer()
    audio_data = sr.AudioData(
        await audio.read(),
        sample_rate=16000,
        sample_width=2
    )
    
    try:
        text = recognizer.recognize_google(audio_data)
    except:
        raise HTTPException(400, "Could not understand audio")
    
    # Process through Fido (reuse existing logic)
    # Create or get active session
    store = get_store()
    sessions = await run_in_threadpool(store.list_sessions_with_messages, user.id)
    
    if not sessions:
        session = await run_in_threadpool(store.create_session, user.id, "fido")
    else:
        session = sessions[0]
    
    # Get response (non-streaming for voice)
    persona_instruction = system_prompt_for_persona(session["personaId"])
    messages = [(m["role"], m["content"]) for m in session["messages"][-10:]]
    
    full_response = ""
    async for delta in stream_reply_events(
        persona_instruction=persona_instruction,
        history=messages,
        user_text=text,
        is_owner=user.is_owner()
    ):
        full_response += delta
    
    return {
        "text_input": text,
        "response": full_response,
        "should_speak": True
    }
```

#### **2.5: Testing Criteria**

- [ ] Wake word detection works reliably
- [ ] Speech-to-text accuracy >90%
- [ ] Voice commands execute correctly
- [ ] TTS sounds natural
- [ ] Response latency <2 seconds
- [ ] Can interrupt other tasks with voice

**Dependencies:**
```bash
pip install pvporcupine SpeechRecognition pyttsx3 pyaudio
```

---

### 👁️ **PHASE 3: Background Activity Monitor**

**Goal:** Track what you do all day, provide insights

**Timeline:** 2-3 weeks

**Priority:** MEDIUM (Cool feature, not critical)

#### **3.1: Create Monitor Service**

**Create:** `services/activity_monitor.py`

```python
import psutil
import time
from datetime import datetime
from mss import mss
import pytesseract
from PIL import Image

class ActivityMonitor:
    """Runs in background, tracks everything you do"""
    
    def __init__(self):
        self.current_activity = None
        self.daily_log = []
    
    async def run(self):
        """Main monitoring loop"""
        await asyncio.gather(
            self.monitor_active_window(),
            self.monitor_screen_content(),
            self.daily_summary_scheduler(),
        )
    
    async def monitor_active_window(self):
        """Track which app is active"""
        while True:
            active = get_active_window_title()
            
            # Detect activities
            if "youtube" in active.lower() and is_fullscreen():
                activity = "watching_video"
                content = extract_title_from_window(active)
                
                await self.log_activity({
                    "type": "watching",
                    "content": content,
                    "timestamp": time.time()
                })
            
            elif "vscode" in active.lower():
                await self.log_activity({
                    "type": "coding",
                    "timestamp": time.time()
                })
            
            elif detect_workout_app():
                await self.log_activity({
                    "type": "working_out",
                    "timestamp": time.time()
                })
            
            await asyncio.sleep(60)  # Check every minute
    
    async def monitor_screen_content(self):
        """OCR screen to detect activities"""
        while True:
            if is_user_idle():
                await asyncio.sleep(60)
                continue
            
            screenshot = capture_screen()
            
            # Detect specific contexts
            if detect_cooking_video(screenshot):
                recipe = extract_recipe_name(screenshot)
                await self.log_activity({
                    "type": "watching_recipe",
                    "recipe": recipe
                })
            
            await asyncio.sleep(120)  # Every 2 minutes
    
    async def log_activity(self, activity: dict):
        """Store activity in Qdrant"""
        text = f"{activity['type']} at {datetime.now().strftime('%I:%M %p')}"
        
        if activity.get('content'):
            text += f": {activity['content']}"
        
        memory = get_memory()
        await memory.store(
            text=text,
            collection="daily_activities",
            metadata={
                "date": datetime.now().strftime("%Y-%m-%d"),
                "activity_type": activity['type'],
                **activity
            }
        )
    
    async def daily_summary_scheduler(self):
        """End-of-day review"""
        while True:
            await wait_until("22:00")  # 10 PM
            
            # Get today's activities
            today = datetime.now().strftime("%Y-%m-%d")
            memory = get_memory()
            
            activities = await memory.search(
                query=f"activities on {today}",
                collection="daily_activities",
                limit=50
            )
            
            # Send to Fido to generate conversational review
            review = await fido_api.generate_daily_review(activities)
            
            # Speak the review
            await speak(review)
            # "Hey! Let's chat about your day. I noticed you had eggs 
            # for breakfast - how was it? You were out from 2-6pm, 
            # where'd you go? ..."
            
            await asyncio.sleep(3600)  # Check every hour
```

#### **3.2: Add Monitor Tools**

**Add to:** `app/api/clone/tools.py`

```python
@_registry.register(
    name="log_activity",
    description="Log what owner is doing right now",
    owner_only=True
)
async def log_activity(
    activity_type: str,
    details: str = ""
) -> dict[str, Any]:
    """
    Background monitor calls this to log activities.
    
    Types: working_out, cooking, watching_movie, coding, etc.
    """
    memory = get_memory()
    
    text = f"{activity_type}"
    if details:
        text += f": {details}"
    
    await memory.store(
        text=text,
        collection="daily_activities",
        metadata={
            "activity_type": activity_type,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%H:%M")
        }
    )
    
    return {"ok": True, "logged": activity_type}
```

#### **3.3: Testing Criteria**

- [ ] Monitor detects active window changes
- [ ] Activities logged to Qdrant
- [ ] End-of-day review generates correctly
- [ ] Fido asks contextual questions about the day
- [ ] No performance impact on system

**Dependencies:**
```bash
pip install psutil mss pytesseract pillow pygetwindow
```

---

### 🖥️ **PHASE 4: Desktop Control Agent**

**Goal:** Fido can control your laptop (mouse, keyboard, apps)

**Timeline:** 2-3 weeks

**Priority:** MEDIUM (Powerful but complex)

#### **4.1: Add Computer Control Tools**

**Add to:** `app/api/clone/tools.py`

```python
import pyautogui
import subprocess

@_registry.register(
    name="control_mouse",
    description="Move mouse and click",
    owner_only=True
)
async def control_mouse(
    action: str,
    x: int = None,
    y: int = None
) -> dict[str, Any]:
    """
    Control mouse.
    
    Actions: move, click, double_click, right_click
    """
    if action == "move" and x and y:
        pyautogui.moveTo(x, y, duration=0.5)
    elif action == "click":
        pyautogui.click()
    elif action == "double_click":
        pyautogui.doubleClick()
    elif action == "right_click":
        pyautogui.rightClick()
    
    return {"ok": True, "action": action}


@_registry.register(
    name="type_text",
    description="Type text on keyboard",
    owner_only=True
)
async def type_text(text: str, interval: float = 0.05) -> dict[str, Any]:
    """Type text as if typing on keyboard"""
    pyautogui.write(text, interval=interval)
    return {"ok": True, "typed": text}


@_registry.register(
    name="press_key",
    description="Press keyboard keys",
    owner_only=True
)
async def press_key(key: str, times: int = 1) -> dict[str, Any]:
    """
    Press keyboard key(s).
    
    Examples: enter, space, tab, ctrl, cmd, etc.
    """
    for _ in range(times):
        pyautogui.press(key)
    
    return {"ok": True, "pressed": key}


@_registry.register(
    name="open_application",
    description="Launch an application",
    owner_only=True
)
async def open_application(app_name: str) -> dict[str, Any]:
    """
    Open an application by name.
    
    Examples: "Chrome", "Spotify", "Terminal"
    """
    try:
        if sys.platform == "darwin":  # macOS
            subprocess.Popen(["open", "-a", app_name])
        elif sys.platform == "win32":  # Windows
            subprocess.Popen([app_name])
        else:  # Linux
            subprocess.Popen([app_name.lower()])
        
        return {"ok": True, "opened": app_name}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@_registry.register(
    name="take_screenshot",
    description="Capture current screen",
    owner_only=True
)
async def take_screenshot() -> dict[str, Any]:
    """
    Take screenshot and analyze it.
    Returns description of what's on screen.
    """
    with mss() as sct:
        screenshot = sct.grab(sct.monitors[1])
        img = Image.frombytes("RGB", screenshot.size, screenshot.rgb)
    
    # Save temporarily
    import base64
    from io import BytesIO
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "ok": True,
        "image": img_base64,
        "width": screenshot.width,
        "height": screenshot.height
    }
```

#### **4.2: Vision Analysis Tool**

```python
@_registry.register(
    name="analyze_screen",
    description="Look at screen and describe what you see",
    owner_only=True
)
async def analyze_screen(question: str = "What's on the screen?") -> dict[str, Any]:
    """
    Capture screen and use Gemini Vision to analyze it.
    
    Use when:
    - Playing games (analyze game state)
    - Helping with tasks (read screen content)
    - Detecting activities (what is owner doing?)
    """
    from google import genai
    
    # Capture screen
    screenshot = await take_screenshot()
    
    # Analyze with Gemini Vision
    client = genai.Client(api_key=get_settings().GEMINI_API_KEY)
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=[
            question,
            {
                "mime_type": "image/png",
                "data": screenshot["image"]
            }
        ]
    )
    
    return {
        "ok": True,
        "analysis": response.text,
        "question": question
    }
```

#### **4.3: Testing Criteria**

- [ ] Can control mouse programmatically
- [ ] Can type text
- [ ] Can press keyboard shortcuts
- [ ] Can open applications
- [ ] Can analyze screen with vision
- [ ] Can execute multi-step computer tasks

**Dependencies:**
```bash
pip install pyautogui mss pillow
```

**Security:** This is powerful! Only allow with owner API key.

---

### 🎮 **PHASE 5: Autonomous Game Playing**

**Goal:** Fido plays games with you autonomously

**Timeline:** 3-4 weeks

**Priority:** MEDIUM (Fun showcase)

#### **5.1: Game Agent Base Class**

**Create:** `services/game_agent.py`

```python
class GameAgent:
    """Base class for game-playing agents"""
    
    def __init__(self, game_name: str):
        self.game_name = game_name
        self.state = "idle"
        self.goal = None
        self.running = False
    
    async def start(self, goal: str = None):
        """Start autonomous playing"""
        self.running = True
        self.goal = goal
        
        await self.game_loop()
    
    async def stop(self):
        """Stop playing"""
        self.running = False
    
    async def game_loop(self):
        """Override in subclasses"""
        raise NotImplementedError
```

#### **5.2: Geoguesser Agent**

**Create:** `services/games/geoguesser_agent.py`

```python
class GeoguessrAgent(GameAgent):
    def __init__(self):
        super().__init__("geoguesser")
        self.last_screenshot = None
        self.current_guess = None
        self.round_number = 0
    
    async def game_loop(self):
        """Continuously analyze and comment on locations"""
        
        while self.running:
            # Capture game screen
            screenshot = await take_screenshot()
            
            # Detect if new round started
            if self.is_new_location(screenshot):
                self.round_number += 1
                await speak("New location! Let me look around...")
                
                # Analyze location
                analysis = await self.analyze_location(screenshot)
                
                # Share thoughts
                await speak(analysis.thought)
                # "I see Cyrillic text and orthodox churches... 
                #  probably Russia or Ukraine!"
                
                self.current_guess = analysis.country
                self.last_screenshot = screenshot
            
            # Keep analyzing if view changes
            elif self.view_changed_slightly(screenshot):
                # User moved camera
                new_clues = await self.analyze_new_clues(screenshot)
                
                if new_clues.changed_mind:
                    await speak(new_clues.update)
                    # "Wait, I see Swedish flags! It's Sweden, not Norway!"
            
            # Check if round ended
            if detect_round_end(screenshot):
                result = get_round_result(screenshot)
                
                if result.correct:
                    await speak("Yes! Nailed it!")
                else:
                    await speak(f"Aw man, I was way off. It was {result.actual}!")
            
            await asyncio.sleep(2)  # Analyze every 2 seconds
    
    async def analyze_location(self, screenshot):
        """Full analysis of new location"""
        
        return await analyze_screen(
            question="""
You're playing Geoguesser. Analyze this location carefully.

Look for:
- Text/language on signs
- Architecture style
- Landscape/terrain
- Climate indicators  
- Vehicles/license plates
- Vegetation type
- Road markings
- Bollards

Give your best guess and explain your reasoning in 1-2 sentences.
Be conversational and excited!
"""
        )
```

#### **5.3: Minecraft Agent**

**Create:** `services/games/minecraft_agent.py`

```python
class MinecraftAgent(GameAgent):
    """Autonomous Minecraft player"""
    
    async def execute_task(self, task: str):
        """
        Examples:
        - "Get 10 diamonds"
        - "Build a house"
        - "Explore and find a village"
        """
        
        # Parse task into goal
        self.goal = await self.parse_goal(task)
        
        # Autonomous loop
        while not self.goal_complete():
            # 1. Observe game state
            obs = await self.observe_minecraft()
            
            # 2. Decide immediate action (LLM call)
            action = await self.decide_action(obs)
            
            # 3. Execute (no waiting for user!)
            await self.execute_mc_action(action)
            
            # 4. Handle interruptions (monsters, lava, etc.)
            if obs.danger_detected:
                await self.handle_danger(obs.danger)
            
            # 5. Update progress
            self.update_goal_progress()
            
            # 6. Occasionally comment
            if should_comment():
                await speak(self.generate_comment())
            
            await asyncio.sleep(0.5)  # Fast gaming loop
        
        await speak(f"Task complete: {task}")
    
    async def decide_action(self, obs):
        """Ask LLM for next immediate action"""
        
        prompt = f"""
Minecraft - Current goal: {self.goal}

STATE:
- Health: {obs.health}/20
- Hunger: {obs.hunger}/20
- Y-level: {obs.y_level}
- Facing: {obs.facing}
- Inventory: {obs.inventory}

IMMEDIATE SURROUNDINGS:
- Blocks ahead: {obs.blocks_ahead}
- Blocks below: {obs.blocks_below}
- Mobs nearby: {obs.mobs}
- Dangers: {obs.dangers}

PROGRESS:
{self.goal_progress()}

What's the SINGLE next action (in next 0.5 seconds)?

Actions: mine_forward, move_forward, turn_left, turn_right, 
         attack, place_block, eat, jump, crouch, retreat

Respond: {{"action": "mine_forward", "reason": "clear path, mining level"}}
"""
        
        decision = await gemini.generate(prompt, max_tokens=50)
        return decision
    
    async def handle_danger(self, danger):
        """React to immediate threats AUTOMATICALLY"""
        
        if danger.type == "lava":
            # Back away immediately
            for _ in range(5):
                press_key('s')  # Back up
                await asyncio.sleep(0.1)
            
            await speak("Whoa! Lava! That was close...")
        
        elif danger.type == "mob":
            # Fight!
            await speak("Zombie! Taking it down...")
            
            while mob_alive(danger.mob_id):
                click_mouse()  # Attack
                await asyncio.sleep(0.1)
            
            await speak("Got it!")
        
        elif danger.type == "falling":
            # Place block below
            place_block()
            await speak("Saved myself!")
```

#### **5.4: Testing Criteria**

- [ ] Agent can play Geoguesser autonomously
- [ ] Makes educated guesses based on visual clues
- [ ] Detects location changes
- [ ] Minecraft agent can mine resources
- [ ] Handles dangers (lava, mobs) automatically
- [ ] Achieves goals without constant user input
- [ ] Provides entertaining commentary

**Dependencies:**
```bash
pip install pyautogui mss pillow pytesseract opencv-python
```

---

### 📺 **PHASE 6: Twitch Vtuber Integration**

**Goal:** Stream on Twitch with AI vtuber

**Timeline:** 3-4 weeks

**Priority:** MEDIUM (Great portfolio piece)

#### **6.1: Twitch Bot Setup**

**Create:** `services/twitch_bot.py`

```python
from twitchio.ext import commands

class FidoTwitchBot(commands.Bot):
    def __init__(self):
        super().__init__(
            token=os.getenv('TWITCH_TOKEN'),
            prefix='!',
            initial_channels=['your_channel']
        )
        self.message_queue = []
        self.last_response_time = 0
    
    async def event_ready(self):
        print(f'🟢 Fido Twitch Bot ready | {self.nick}')
        
        # Start background tasks
        asyncio.create_task(self.process_chat_queue())
    
    async def event_message(self, message):
        """Called for every chat message"""
        
        if message.echo:  # Ignore own messages
            return
        
        # Add to queue
        self.message_queue.append({
            "user": message.author.name,
            "text": message.content,
            "timestamp": time.time()
        })
    
    async def process_chat_queue(self):
        """Process chat messages intelligently"""
        
        while True:
            if not self.message_queue:
                await asyncio.sleep(1)
                continue
            
            # Get recent context (last 10 messages)
            recent = self.message_queue[-10:]
            
            # Ask Fido: Should I respond?
            decision = await self.should_respond_to_chat(recent)
            
            if decision.should_respond:
                # Check if we're busy
                if not orchestrator.can_handle_chat():
                    await asyncio.sleep(5)
                    continue
                
                # Generate response using Fido
                response = await fido_api.generate_chat_response(
                    recent_messages=recent,
                    context=self.get_stream_context()
                )
                
                # Send to chat
                await self.send_message(response)
                
                # Animate vtuber (if streaming)
                await vtuber.speak(response)
                
                self.last_response_time = time.time()
            
            await asyncio.sleep(3)  # Process every 3 seconds
    
    async def should_respond_to_chat(self, messages):
        """Use Fido to decide if chat deserves response"""
        
        context = {
            "messages": messages,
            "time_since_last_response": time.time() - self.last_response_time,
            "current_activity": orchestrator.current_activity
        }
        
        prompt = f"""
You're streaming on Twitch. Recent chat:
{format_chat_messages(messages)}

Should you respond?

RESPOND TO:
- Direct questions to you
- Funny/interesting comments
- Challenges or bets
- New viewer greetings

IGNORE:
- Emote spam
- Side conversations
- Generic chat

Time since last response: {context['time_since_last_response']}s
Currently: {context['current_activity']}

Decision: {{"respond": true/false, "message": "...", "why": "..."}}
"""
        
        return await gemini.generate(prompt)
```

#### **6.2: Donation/Subscription Handlers**

```python
@event_bus.on("twitch_donation")
async def on_donation(event):
    """ALWAYS acknowledge donations (highest priority!)"""
    
    # Interrupt whatever we're doing
    await orchestrator.interrupt(
        priority=Priority.HIGH,
        task="acknowledge_donation"
    )
    
    # Generate personalized thank you
    thanks = await fido_api.generate(
        f"Generate a grateful response to {event.user} for donating ${event.amount}. "
        f"Their message: {event.message}. Be genuine and excited!"
    )
    
    # Say it!
    await vtuber.speak(thanks)
    
    # Resume previous task
    await orchestrator.resume_previous()


@event_bus.on("twitch_subscription")
async def on_subscription(event):
    """Announce new subs"""
    
    await orchestrator.interrupt(
        priority=Priority.HIGH,
        task="announce_sub"
    )
    
    await vtuber.speak(
        f"Yooo! {event.user} just subscribed! Welcome to the family! 🎉"
    )
```

#### **6.3: OBS Control**

**Add to:** `app/api/clone/tools.py`

```python
from obswebsocket import obsws, requests as obs_requests

@_registry.register(
    name="change_obs_scene",
    description="Change OBS streaming scene",
    owner_only=True
)
async def change_obs_scene(scene_name: str) -> dict[str, Any]:
    """
    Switch OBS scene.
    
    Scenes: Gaming, Chatting, BRB, Ending, Starting
    """
    try:
        ws = obsws("localhost", 4455, os.getenv("OBS_PASSWORD"))
        ws.connect()
        ws.call(obs_requests.SetCurrentProgramScene(sceneName=scene_name))
        ws.disconnect()
        
        return {"ok": True, "scene": scene_name}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@_registry.register(
    name="start_stream",
    description="Start OBS streaming",
    owner_only=True
)
async def start_stream() -> dict[str, Any]:
    """Start streaming on Twitch via OBS"""
    ws = obsws("localhost", 4455, os.getenv("OBS_PASSWORD"))
    ws.connect()
    ws.call(obs_requests.StartStream())
    ws.disconnect()
    
    return {"ok": True, "streaming": True}
```

#### **6.4: Vtuber Avatar Integration**

```python
@_registry.register(
    name="animate_vtuber",
    description="Control vtuber avatar movements",
    owner_only=True
)
async def animate_vtuber(
    expression: str,
    duration: float = 2.0
) -> dict[str, Any]:
    """
    Control vtuber avatar via VTube Studio API.
    
    Expressions: happy, sad, surprised, angry, thinking, etc.
    """
    async with httpx.AsyncClient() as client:
        await client.post(
            "http://localhost:8001/api/expressions/set",
            json={
                "expression": expression,
                "duration": duration
            }
        )
    
    return {"ok": True, "expression": expression}
```

#### **6.5: Testing Criteria**

- [ ] Can connect to Twitch chat
- [ ] Reads and responds to messages intelligently
- [ ] Acknowledges donations immediately
- [ ] Announces subscriptions/follows
- [ ] Controls OBS scenes
- [ ] Starts/stops stream
- [ ] Animates vtuber avatar

**Dependencies:**
```bash
pip install twitchio obs-websocket-py
```

---

### 🧠 **PHASE 7: Orchestrator & Priority System**

**Goal:** Manage multiple simultaneous tasks with priorities

**Timeline:** 2-3 weeks

**Priority:** HIGH (Required for multi-tasking)

#### **7.1: Create Orchestrator**

**Create:** `app/api/clone/orchestrator.py`

```python
from enum import IntEnum
from asyncio import Queue, PriorityQueue
from dataclasses import dataclass
from typing import Callable, Any

class Priority(IntEnum):
    URGENT = 1      # Voice commands, safety, critical errors
    HIGH = 2        # Donations, important notifications, calls
    MEDIUM = 3      # Game actions, chat responses
    LOW = 4         # Background monitoring, idle chat
    BACKGROUND = 5  # Logging, daily summaries

@dataclass
class Task:
    priority: Priority
    name: str
    callback: Callable
    args: dict
    interruptible: bool = True
    created_at: float = None

class Orchestrator:
    """
    Central brain that manages all concurrent activities.
    
    Decides:
    - What to do now
    - What to pause
    - What to interrupt
    - What to queue for later
    """
    
    def __init__(self):
        self.task_queue = PriorityQueue()
        self.current_task: Task | None = None
        self.paused_tasks: list[Task] = []
        self.running_background_tasks = {}
        self.state = {
            "mode": "idle",
            "streaming": False,
            "user_present": True,
            "can_speak": True
        }
    
    async def start(self):
        """Start orchestrator - this runs forever!"""
        
        # Start background tasks
        asyncio.create_task(self.background_monitor_loop())
        asyncio.create_task(self.voice_listener_loop())
        asyncio.create_task(self.state_manager_loop())
        
        # Main task processing loop
        while True:
            try:
                # Get next task (blocks if queue empty)
                priority, task = await self.task_queue.get()
                
                # Check if should interrupt current task
                if self.current_task:
                    if priority < self.current_task.priority:
                        # Higher priority task!
                        if self.current_task.interruptible:
                            await self.pause_current_task()
                        else:
                            # Wait for current to finish
                            continue
                
                # Execute task
                self.current_task = task
                await self.execute_task(task)
                self.current_task = None
                
                # Resume paused tasks if any
                if self.paused_tasks:
                    await self.resume_paused_task()
                
            except Exception as e:
                print(f"Orchestrator error: {e}")
                self.current_task = None
    
    async def queue_task(
        self,
        priority: Priority,
        name: str,
        callback: Callable,
        args: dict = None,
        interruptible: bool = True
    ):
        """Add task to queue"""
        task = Task(
            priority=priority,
            name=name,
            callback=callback,
            args=args or {},
            interruptible=interruptible,
            created_at=time.time()
        )
        
        await self.task_queue.put((priority, task))
    
    async def interrupt(self, priority: Priority, name: str, callback: Callable):
        """Immediately interrupt for urgent task"""
        
        if self.current_task and self.current_task.interruptible:
            await self.pause_current_task()
        
        # Execute immediately
        task = Task(
            priority=priority,
            name=name,
            callback=callback,
            args={},
            interruptible=False
        )
        
        self.current_task = task
        await self.execute_task(task)
        self.current_task = None
        
        # Resume what was interrupted
        await self.resume_paused_task()
    
    def can_handle_chat(self) -> bool:
        """Check if we can respond to chat right now"""
        if not self.current_task:
            return True
        
        # Can multitask during low priority tasks
        return self.current_task.priority >= Priority.MEDIUM
    
    def is_busy(self) -> bool:
        """Check if busy with important task"""
        if not self.current_task:
            return False
        
        return self.current_task.priority <= Priority.MEDIUM

# Global orchestrator instance
_orchestrator = None

def get_orchestrator() -> Orchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator
```

#### **7.2: Integrate with Fido Core**

**Update:** `app/api/clone/api.py`

```python
from .orchestrator import get_orchestrator, Priority

@api.post("/clone/task/queue")
async def queue_task(
    task_type: str,
    priority: str,
    data: dict,
    user: User = Depends(get_current_user)
):
    """
    Queue a task for orchestrator to handle.
    
    Examples:
    - Play a game
    - Monitor screen
    - Start streaming
    - Execute automation
    """
    orchestrator = get_orchestrator()
    
    # Map string to Priority enum
    priority_map = {
        "urgent": Priority.URGENT,
        "high": Priority.HIGH,
        "medium": Priority.MEDIUM,
        "low": Priority.LOW,
        "background": Priority.BACKGROUND
    }
    
    await orchestrator.queue_task(
        priority=priority_map[priority],
        name=task_type,
        callback=get_task_handler(task_type),
        args=data
    )
    
    return {"ok": True, "queued": task_type}
```

#### **7.3: Testing Criteria**

- [ ] Can run multiple background tasks
- [ ] High priority tasks interrupt low priority
- [ ] Voice commands always get through
- [ ] Donations acknowledged immediately
- [ ] Game playing continues unless interrupted
- [ ] State is maintained across interruptions

---

### 🔄 **PHASE 8: Continuous Agent Modes**

**Goal:** Always-on autonomous behavior

**Timeline:** 2-3 weeks

**Priority:** HIGH (Core to "feeling alive")

#### **8.1: Create Agent Loop Manager**

**Create:** `app/api/clone/agent_loop.py`

```python
class AgentLoop:
    """
    Continuous loop that makes Fido feel alive.
    
    Instead of waiting for input, Fido continuously:
    - Observes
    - Thinks
    - Decides
    - Acts
    """
    
    def __init__(self):
        self.mode = "idle"
        self.running = False
        self.loop_task = None
    
    async def start(self, mode: str):
        """Start continuous agent loop"""
        self.mode = mode
        self.running = True
        
        if mode == "conversation":
            self.loop_task = asyncio.create_task(self.conversation_loop())
        elif mode == "gaming":
            self.loop_task = asyncio.create_task(self.gaming_loop())
        elif mode == "streaming":
            self.loop_task = asyncio.create_task(self.streaming_loop())
    
    async def conversation_loop(self):
        """Natural conversation mode"""
        
        while self.running:
            # Observe context
            context = await self.gather_context()
            
            # Decide: Should I say something?
            decision = await self.decide_if_should_speak(context)
            
            if decision.should_speak:
                if orchestrator.can_speak():
                    await speak(decision.message)
            
            await asyncio.sleep(10)  # Think every 10 seconds
    
    async def gaming_loop(self):
        """Active gaming mode"""
        
        while self.running:
            # Capture game state
            screenshot = await take_screenshot()
            game_state = await analyze_screen(
                "What's happening in the game right now?"
            )
            
            # Decide next action
            action = await self.decide_game_action(game_state)
            
            # Execute immediately
            if action.type != "wait":
                await self.execute_game_action(action)
            
            # Occasionally comment
            if random.random() < 0.1:
                comment = await self.generate_commentary(game_state)
                await speak(comment)
            
            await asyncio.sleep(0.5)  # Fast loop for gaming
    
    async def streaming_loop(self):
        """Multi-task streaming mode"""
        
        while self.running:
            # Handle multiple things in parallel
            await asyncio.gather(
                self.monitor_chat(),
                self.monitor_donations(),
                self.play_current_game(),
                self.idle_behavior()
            )
    
    async def decide_if_should_speak(self, context):
        """Ask Fido: Should I say something right now?"""
        
        prompt = f"""
Context:
- Time: {context['time']}
- Last spoke: {context['seconds_since_last_speech']}s ago
- Owner activity: {context['user_activity']}
- Currently: {context['current_task']}

Should you speak up right now?

SPEAK IF:
- It's been >2 hours since last interaction (check in)
- You notice something important
- There's an urgent matter
- Owner seems to need help

STAY QUIET IF:
- Owner is focused (gaming, working, movie)
- Recently spoke (<5 min ago)
- Nothing important to say

Decision: {{"speak": true/false, "message": "...", "reason": "..."}}
"""
        
        return await gemini.generate(prompt, max_tokens=100)
```

#### **8.2: Add Agent Loop Endpoints**

**Add to:** `app/api/clone/api.py`

```python
from .agent_loop import get_agent_loop

@api.post("/clone/agent/start-loop")
async def start_agent_loop(
    mode: str,
    user: User = Depends(get_current_user)
):
    """
    Start continuous autonomous agent loop.
    
    Modes:
    - conversation: Natural conversation, proactive check-ins
    - gaming: Playing games autonomously
    - streaming: Twitch streaming mode
    - monitoring: Just observe and log
    """
    agent_loop = get_agent_loop()
    await agent_loop.start(mode)
    
    return {"ok": True, "mode": mode, "status": "running"}


@api.post("/clone/agent/stop-loop")
async def stop_agent_loop(user: User = Depends(get_current_user)):
    """Stop autonomous loop"""
    agent_loop = get_agent_loop()
    await agent_loop.stop()
    
    return {"ok": True, "status": "stopped"}
```

#### **8.3: Testing Criteria**

- [ ] Agent runs continuously without stopping
- [ ] Knows when to speak vs stay quiet
- [ ] Can switch between modes
- [ ] Handles interruptions gracefully
- [ ] Maintains context across mode switches
- [ ] No infinite loops or hangs

---

### 🎭 **PHASE 9: Full Integration & Polish**

**Goal:** Everything working together seamlessly

**Timeline:** 2-4 weeks

**Priority:** HIGH (Final polish)

#### **9.1: Unified Frontend**

**Create:** `app/clone/multimodal.tsx`

```tsx
// Single interface for all modes

export default function FidoMultiModal() {
  const [mode, setMode] = useState<"text" | "voice" | "vision">("text");
  
  return (
    <div>
      {/* Mode selector */}
      <ModeSelector onChange={setMode} />
      
      {/* Render appropriate interface */}
      {mode === "text" && <TextChat />}
      {mode === "voice" && <VoiceInterface />}
      {mode === "vision" && <VisionInterface />}
      
      {/* Shared components */}
      <AgentStatus />  {/* What is Fido doing right now? */}
      <ToolActivity /> {/* Recent tool calls */}
      <Memory />       {/* Access memory/context */}
    </div>
  );
}
```

#### **9.2: System Health Monitor**

```python
@api.get("/clone/status")
async def system_status():
    """Check health of all systems"""
    
    return {
        "core": {
            "fido_api": "healthy",
            "database": "connected",
            "gemini": "api_ok"
        },
        "services": {
            "voice_service": check_service_health("voice"),
            "monitor_service": check_service_health("monitor"),
            "twitch_bot": check_service_health("twitch")
        },
        "agent": {
            "mode": agent_loop.mode,
            "current_task": orchestrator.current_task,
            "queue_size": orchestrator.queue_size
        }
    }
```

#### **9.3: Comprehensive Testing**

- [ ] All phases work independently
- [ ] All phases work together
- [ ] No conflicts between services
- [ ] Priority system works correctly
- [ ] Memory persists across restarts
- [ ] Performance is acceptable
- [ ] No memory leaks

---

## 🗂️ **File Structure (Complete)**

```
portfolio/
├── app/
│   ├── clone/                          # Frontend
│   │   ├── docs/                       # All documentation
│   │   │   ├── MASTER_PLAN.md         # This file
│   │   │   ├── START_HERE.md
│   │   │   ├── GETTING_STARTED.md
│   │   │   ├── API_KEYS_GUIDE.md
│   │   │   └── ...
│   │   ├── components/
│   │   ├── page.tsx                   # Text chat
│   │   ├── voice.tsx                  # [PHASE 2] Voice interface
│   │   ├── vision.tsx                 # [PHASE 2] Camera interface
│   │   ├── multimodal.tsx             # [PHASE 9] Unified interface
│   │   ├── useAuth.ts
│   │   ├── useSessions.ts
│   │   ├── useChat.ts
│   │   └── useCloneChat.ts
│   │
│   └── api/
│       ├── clone/                      # Fido Backend (Core)
│       │   ├── api.py                 # Main API routes
│       │   ├── auth.py                # Authentication
│       │   ├── tools.py               # Tool registry + all tools
│       │   ├── adk_agent.py           # Gemini AI integration
│       │   ├── store.py               # Appwrite (conversations)
│       │   ├── memory.py              # [PHASE 1] RAG system
│       │   ├── orchestrator.py        # [PHASE 7] Task management
│       │   ├── agent_loop.py          # [PHASE 8] Continuous loops
│       │   ├── persona.py             # System prompts
│       │   ├── settings.py            # Configuration
│       │   ├── schemas.py             # Data models
│       │   └── util.py                # Helpers
│       │
│       └── main.py                    # FastAPI app
│
├── services/                           # External Services
│   ├── voice_service.py               # [PHASE 2] Wake word + STT/TTS
│   ├── activity_monitor.py            # [PHASE 3] Background monitoring
│   ├── twitch_bot.py                  # [PHASE 6] Twitch integration
│   ├── vtuber_controller.py           # [PHASE 6] Avatar control
│   │
│   └── games/                         # Game agents
│       ├── geoguesser_agent.py       # [PHASE 5]
│       ├── minecraft_agent.py        # [PHASE 5]
│       └── game_agent_base.py        # [PHASE 5] Base class
│
├── requirements.txt                   # All Python deps
└── .env                               # Configuration
```

---

## 🔧 **Technology Stack**

### **Core (Phase 0) ✅**
```
- fastapi
- google-adk
- google-generativeai
- appwrite
- httpx
- pydantic
```

### **Phase 1: Memory**
```
- qdrant-client
- sentence-transformers
```

### **Phase 2: Voice**
```
- pvporcupine (wake word)
- SpeechRecognition (STT)
- pyttsx3 (TTS)
- pyaudio
```

### **Phase 3: Monitoring**
```
- psutil (process monitoring)
- mss (screenshots)
- pytesseract (OCR)
- pillow (image processing)
- pygetwindow (window detection)
```

### **Phase 4: Desktop Control**
```
- pyautogui (mouse/keyboard)
- opencv-python (vision)
```

### **Phase 6: Twitch**
```
- twitchio (Twitch chat)
- obs-websocket-py (OBS control)
```

---

## 📊 **Implementation Order & Dependencies**

```
Phase 0 (Foundation) ✅
    ↓
Phase 1 (Memory) ← START HERE
    ↓
Phase 2 (Voice)
    ↓
Phase 7 (Orchestrator) ← Needed before multi-tasking
    ↓
Phase 3 (Monitoring)
    ↓
Phase 4 (Desktop Control)
    ↓
Phase 5 (Games)
    ↓
Phase 6 (Twitch)
    ↓
Phase 8 (Agent Loops)
    ↓
Phase 9 (Integration)
```

---

## 🎯 **Key Architecture Decisions**

### **1. Reactive vs Autonomous**

**Current (Reactive):**
```python
# User sends message → Fido responds → Waits
await send_message(user_input)
```

**Future (Autonomous):**
```python
# Fido runs continuously
while True:
    context = observe()
    decision = await decide(context)
    if decision.should_act:
        await act(decision)
    await asyncio.sleep(interval)
```

### **2. Prompting vs Fine-tuning**

**Decision: Use Prompting + RAG**

**Why:**
- ✅ Gemini 2.0 is excellent at following instructions
- ✅ RAG gives you memory (fine-tuning doesn't!)
- ✅ Can iterate on prompts instantly
- ✅ Way cheaper ($5/month vs $500+ upfront)
- ✅ More flexible

**Only fine-tune if:**
- Prompting fails after extensive testing
- You need very specific output format
- You have 1000+ training examples
- You have budget ($500+)

### **3. MCP: Direct vs n8n**

**Direct MCP Connection:**
- ✅ Lower latency
- ✅ Simpler debugging
- ✅ Good for: Real-time control (screen, keyboard)

**Via n8n:**
- ✅ Visual workflows
- ✅ Error handling built-in
- ✅ Good for: Multi-step tasks (smart home with Qdrant lookup)

**Recommendation:**
- Simple/fast actions → Direct MCP
- Complex workflows → n8n

### **4. Monorepo vs Microservices**

**Decision: Monorepo with External Services**

**Core (in portfolio repo):**
- `app/api/clone/` - Fido brain
- `app/clone/` - Web interface

**External services (separate processes):**
- `services/voice_service.py` - Run separately
- `services/activity_monitor.py` - Run separately
- `services/twitch_bot.py` - Run separately

**All services call Fido Core API!**

---

## 📝 **Environment Variables Needed**

```env
# Core (Phase 0) ✅
OWNER_API_KEY=...
GEMINI_API_KEY=...
APPWRITE_CLONE_PROJECT=...
APPWRITE_CLONE_API_KEY=...
APPWRITE_CLONE_DB_ID=...
APPWRITE_CLONE_SESSIONS_COLL_ID=...
APPWRITE_CLONE_MESSAGES_COLL_ID=...
N8N_WEBHOOK_URL=...

# Phase 1: Memory
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...

# Phase 2: Voice
PORCUPINE_ACCESS_KEY=...

# Phase 4: Desktop
# (No additional env vars needed)

# Phase 6: Twitch
TWITCH_TOKEN=...
TWITCH_CHANNEL=...
TWITCH_CLIENT_ID=...
OBS_PASSWORD=...
VTUBE_STUDIO_API_KEY=...

# Optional: Alternative models
GROQ_API_KEY=...
OPENAI_API_KEY=...
```

---

## 🎯 **Critical Success Factors**

### **1. Start Small, Build Incrementally**
- ✅ Complete Phase 1 fully before Phase 2
- ✅ Test each phase thoroughly
- ✅ Don't try to build everything at once

### **2. Focus on Core Loop First**
- ✅ Get observe → decide → act loop working
- ✅ Everything else builds on this pattern

### **3. Memory is Key**
- ✅ RAG/memory system unlocks everything else
- ✅ Makes Fido feel intelligent and contextual

### **4. Orchestrator is Essential**
- ✅ Without it, everything conflicts
- ✅ Spend time getting priority system right

### **5. Test with Real Use**
- ✅ Use Fido daily during development
- ✅ Find UX issues early
- ✅ Iterate on prompts constantly

---

## 📊 **Estimated Timeline**

| Phase | Time | Difficulty | Impact |
|-------|------|-----------|---------|
| 0. Foundation | ✅ Done | Medium | Critical |
| 1. Memory/RAG | 1-2 weeks | Medium | Very High |
| 2. Voice | 2-3 weeks | Medium | High |
| 3. Monitoring | 2-3 weeks | Medium | Medium |
| 4. Desktop Control | 2-3 weeks | High | Medium |
| 5. Games | 3-4 weeks | High | Low |
| 6. Twitch | 3-4 weeks | High | Medium |
| 7. Orchestrator | 2-3 weeks | High | Critical |
| 8. Agent Loops | 2-3 weeks | High | Critical |
| 9. Integration | 2-4 weeks | Very High | Critical |

**Total: 5-8 months of focused work**

**Realistic timeline with part-time work: 8-12 months**

---

## 🚦 **Getting Started**

### **Immediate Next Steps:**

1. **Read this entire plan** ✅
2. **Start Phase 1** (Memory/RAG)
   - Install Qdrant
   - Create `memory.py`
   - Add memory tools to `tools.py`
   - Test with conversations
3. **Test thoroughly** before moving to Phase 2
4. **Document as you go**

### **When You Come Back:**

Give me this message:
```
"I'm ready to implement [PHASE X]. Here's what I've completed so far: [...]
Please help me build [specific component]."
```

I'll have full context from this plan!

---

## 💡 **Key Principles**

1. **Your current Fido is the brain** - Everything connects to it
2. **Services are satellites** - They call Fido, Fido doesn't call them
3. **Memory is in RAG** - Not in fine-tuning
4. **Prompts over training** - Iterate fast
5. **Autonomous loops** - Don't wait for input
6. **Priority matters** - Voice > Donations > Chat > Background
7. **Test continuously** - Use it daily

---

## 🎉 **End Goal**

You'll have:
- 🎤 Voice assistant (always listening)
- 🧠 Perfect memory (RAG)
- 🖥️ Desktop control
- 📺 Twitch vtuber
- 🎮 Autonomous game player
- 📊 Daily activity insights
- 🏠 Smart home control
- 🔔 Notifications
- 🎯 Priority-based multi-tasking

**All coordinated by your Fido Core!** 🚀

**This will be an INCREDIBLE portfolio project.** ✨

---

## 📞 **Questions to Ask When Implementing**

For each phase, ask yourself:

1. **Does this connect to Fido Core?** (Yes = good architecture)
2. **Can this run independently?** (Yes = good design)
3. **What happens if it crashes?** (Should not break other parts)
4. **How does it handle interruptions?** (Orchestrator manages this)
5. **Is this testable?** (Can I test this component alone?)

---

## 🔖 **Bookmarks**

**Essential reading:**
- Phase 1 (Memory) - Do this first!
- Phase 7 (Orchestrator) - Critical for multi-tasking
- Phase 8 (Agent Loops) - Makes Fido "alive"

**Optional but cool:**
- Phase 5 (Games) - Great for portfolio showcase
- Phase 6 (Twitch) - If you want to stream

**Can wait:**
- Phase 3 (Monitoring) - Nice to have
- Phase 4 (Desktop Control) - Advanced feature

---

## 🎯 **Success Metrics**

You'll know you're done when:

- [ ] Fido responds to "Hey Fido" voice commands
- [ ] Fido remembers your preferences across sessions
- [ ] Fido proactively checks in during the day
- [ ] Fido can play games autonomously
- [ ] Fido can stream on Twitch
- [ ] Multiple tasks run simultaneously
- [ ] Urgent tasks interrupt non-urgent tasks
- [ ] You use Fido daily for real tasks

---

## 🚀 **Ready to Build!**

This plan is your roadmap. Each phase is:
- ✅ Well-defined
- ✅ Testable
- ✅ Incremental
- ✅ Builds on previous phases

**Start with Phase 1 (Memory).** Come back with this plan when ready!

Good luck building your JARVIS! 🤖✨

