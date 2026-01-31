# 🛠️ Tool Examples for Your Fido

Quick reference for adding the tools you mentioned wanting!

---

## 1. OBS Scene Control

**What:** Change OBS scenes from chat ("switch to gaming scene")

**Setup:**
```bash
pip install obsws-python
```

**Code:** Add to `app/api/clone/tools.py`

```python
from obswebsocket import obsws, requests as obs_requests

@_registry.register(
    name="change_obs_scene",
    description="Change OBS streaming scene",
    owner_only=True,
)
async def change_obs_scene(scene_name: str) -> dict[str, Any]:
    """
    Change the active OBS scene.
    
    Args:
        scene_name: Name of the scene to switch to (e.g. "Gaming", "Chatting", "BRB")
    
    Examples:
        - "switch to gaming scene"
        - "change to chatting"
        - "go to brb screen"
    """
    try:
        # Connect to OBS (adjust host/port if needed)
        ws = obsws("localhost", 4455, "your-obs-password")
        ws.connect()
        
        # Change scene
        ws.call(obs_requests.SetCurrentProgramScene(sceneName=scene_name))
        ws.disconnect()
        
        return {
            "ok": True,
            "result": f"Switched to scene: {scene_name}"
        }
    except Exception as e:
        return {
            "ok": False,
            "result": f"Failed to change scene: {str(e)}"
        }
```

**Or use n8n:**

```python
_registry.register_n8n_webhook(
    name="obs_control",
    webhook_url=os.getenv("N8N_OBS_WEBHOOK"),
    description="Control OBS scenes and sources",
    owner_only=True,
)
```

---

## 2. Twitch Chat Analysis

**What:** "Summarize my chat from the last hour" or "what are people saying?"

**Option A: Real-time monitoring (separate service)**

This runs in background, stores chat messages:

```python
# separate_service.py
from twitchio.ext import commands

class TwitchBot(commands.Bot):
    def __init__(self):
        super().__init__(token='...', prefix='!', initial_channels=['your_channel'])
        self.recent_messages = []
    
    async def event_message(self, message):
        # Store messages for Fido to query
        self.recent_messages.append({
            "user": message.author.name,
            "text": message.content,
            "timestamp": time.time()
        })
```

**Option B: Fido tool (query on demand)**

```python
@_registry.register(
    name="analyze_twitch_chat",
    description="Analyze recent Twitch chat messages",
    owner_only=True,
)
async def analyze_twitch_chat(hours: int = 1) -> dict[str, Any]:
    """
    Get summary of recent Twitch chat activity.
    
    Args:
        hours: How many hours back to analyze (default: 1)
    """
    # Option 1: Query your separate service's database
    # Option 2: Use Twitch API to get recent messages
    # Option 3: Query n8n workflow that monitors chat
    
    s = get_settings()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            s.N8N_WEBHOOK_URL,
            json={
                "type": "twitch_chat_summary",
                "hours": hours
            }
        )
        data = res.json()
        return {
            "ok": True,
            "summary": data.get("summary"),
            "top_messages": data.get("top_messages", []),
            "user_count": data.get("user_count", 0)
        }
```

**Recommendation:** 
- Background service to collect chat → Store in database
- Fido tool to query/summarize → Ask AI to analyze

---

## 3. Smart Home Control

**What:** "Turn on living room lights", "lock the door", etc.

Already implemented! But here's how to expand it:

```python
@_registry.register(
    name="control_lights",
    description="Control smart lights (on/off, brightness, color)",
    owner_only=True,
)
async def control_lights(
    room: str,
    action: str,
    brightness: int | None = None,
    color: str | None = None
) -> dict[str, Any]:
    """
    Control smart lights via Home Assistant.
    
    Args:
        room: Room name (e.g. "living room", "bedroom")
        action: "on", "off", "dim", "brighten"
        brightness: 0-100 (optional)
        color: Color name or hex (optional)
    """
    s = get_settings()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            s.N8N_WEBHOOK_URL,
            json={
                "type": "smart_home",
                "device": "lights",
                "room": room,
                "action": action,
                "brightness": brightness,
                "color": color,
            }
        )
        return res.json()
```

---

## 4. Send Notifications

Already done! (`send_notification` in `tools.py`)

**Expand it:**

```python
@_registry.register(
    name="notify_me",
    description="Send notifications via multiple channels",
    owner_only=True,
)
async def notify_me(
    message: str,
    channel: str = "push",  # push, sms, email
    priority: str = "normal",  # low, normal, high, urgent
) -> dict[str, Any]:
    """
    Send notification through specified channel.
    
    Channels: push, sms, email, discord, telegram
    Priority: low, normal, high, urgent
    """
    s = get_settings()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            s.N8N_WEBHOOK_URL,
            json={
                "type": "notification",
                "message": message,
                "channel": channel,
                "priority": priority,
            }
        )
        return res.json()
```

---

## 5. Web Search

**What:** "Search for best restaurants near me", "What's the weather?"

**Option A: Google Custom Search**

```python
@_registry.register(
    name="web_search",
    description="Search the web for current information",
    owner_only=False,  # Safe for guests
)
async def web_search(query: str, num_results: int = 5) -> dict[str, Any]:
    """
    Search the web and return results.
    
    Use this when you need current information not in your training data.
    """
    import os
    api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
    search_engine_id = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
    
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://www.googleapis.com/customsearch/v1",
            params={
                "key": api_key,
                "cx": search_engine_id,
                "q": query,
                "num": num_results,
            }
        )
        data = res.json()
        
        results = []
        for item in data.get("items", []):
            results.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet"),
            })
        
        return {"ok": True, "results": results}
```

**Option B: Tavily (better for AI)**

```python
@_registry.register(
    name="web_search",
    description="Search the web for current information",
    owner_only=False,
)
async def web_search(query: str) -> dict[str, Any]:
    """Search using Tavily AI search."""
    import os
    from tavily import TavilyClient
    
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    response = client.search(query, search_depth="advanced")
    
    return {
        "ok": True,
        "answer": response.get("answer"),
        "results": response.get("results", [])
    }
```

---

## 6. Calendar Management

**What:** "Add dentist appointment tomorrow at 2pm", "What's on my calendar?"

```python
@_registry.register(
    name="manage_calendar",
    description="View and manage calendar events",
    owner_only=True,
)
async def manage_calendar(
    action: str,
    title: str | None = None,
    date: str | None = None,
    time: str | None = None,
    duration: int | None = None,
) -> dict[str, Any]:
    """
    Manage calendar events.
    
    Args:
        action: "add", "list", "delete", "update"
        title: Event title
        date: Date in YYYY-MM-DD format
        time: Time in HH:MM format
        duration: Duration in minutes
    """
    s = get_settings()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            s.N8N_WEBHOOK_URL,
            json={
                "type": "calendar",
                "action": action,
                "title": title,
                "date": date,
                "time": time,
                "duration": duration,
            }
        )
        return res.json()
```

---

## 7. Shopping List / Walmart Cart

**What:** "Add milk to shopping list", "Order groceries from Walmart"

```python
@_registry.register(
    name="shopping_list",
    description="Manage shopping list and add items to Walmart cart",
    owner_only=True,
)
async def shopping_list(
    action: str,
    items: list[str] | None = None,
) -> dict[str, Any]:
    """
    Manage shopping list.
    
    Args:
        action: "add", "remove", "list", "order_walmart"
        items: List of items to add/remove
    """
    s = get_settings()
    async with httpx.AsyncClient() as client:
        res = await client.post(
            s.N8N_WEBHOOK_URL,
            json={
                "type": "shopping",
                "action": action,
                "items": items,
            }
        )
        return res.json()
```

**n8n workflow would:**
1. Store items in database/Appwrite
2. Use Walmart API to add to cart
3. Send confirmation notification

---

## 8. Camera / Vision

**What:** "What do you see?" (look at webcam), "Is the door open?"

```python
@_registry.register(
    name="analyze_camera",
    description="Analyze webcam or security camera feed",
    owner_only=True,
)
async def analyze_camera(
    camera: str = "webcam",
    question: str | None = None
) -> dict[str, Any]:
    """
    Capture image from camera and analyze it.
    
    Args:
        camera: "webcam", "front_door", "backyard", etc.
        question: Optional specific question about the image
    """
    import base64
    from google import genai
    
    # Capture image (implementation depends on your setup)
    # Option 1: opencv-python for webcam
    # Option 2: API call to security camera
    # Option 3: n8n workflow that captures and returns image
    
    # For webcam example:
    import cv2
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        return {"ok": False, "error": "Failed to capture image"}
    
    # Encode to base64
    _, buffer = cv2.imencode('.jpg', frame)
    image_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Use Gemini Vision to analyze
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    prompt = question or "Describe what you see in this image in detail."
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-exp",
        contents=[
            prompt,
            {"mime_type": "image/jpeg", "data": image_base64}
        ]
    )
    
    return {
        "ok": True,
        "description": response.text,
        "camera": camera,
    }
```

---

## 9. File Operations

**What:** "Save this to a file", "Read my notes", "Create a document"

```python
@_registry.register(
    name="file_operations",
    description="Read, write, and manage files",
    owner_only=True,
)
async def file_operations(
    action: str,
    path: str,
    content: str | None = None,
) -> dict[str, Any]:
    """
    Perform file operations.
    
    Args:
        action: "read", "write", "append", "delete", "list"
        path: File path (relative to safe directory)
        content: Content to write (for write/append)
    
    SECURITY: Only allows access to ~/fido_files/ directory
    """
    import os
    import pathlib
    
    # Define safe directory
    safe_dir = pathlib.Path.home() / "fido_files"
    safe_dir.mkdir(exist_ok=True)
    
    # Validate path is within safe directory
    target_path = (safe_dir / path).resolve()
    if not str(target_path).startswith(str(safe_dir)):
        return {"ok": False, "error": "Access denied: Path outside safe directory"}
    
    try:
        if action == "read":
            content = target_path.read_text()
            return {"ok": True, "content": content}
        
        elif action == "write":
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content or "")
            return {"ok": True, "result": f"Wrote to {path}"}
        
        elif action == "append":
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "a") as f:
                f.write(content or "")
            return {"ok": True, "result": f"Appended to {path}"}
        
        elif action == "delete":
            target_path.unlink()
            return {"ok": True, "result": f"Deleted {path}"}
        
        elif action == "list":
            files = [f.name for f in target_path.iterdir()]
            return {"ok": True, "files": files}
        
        else:
            return {"ok": False, "error": f"Unknown action: {action}"}
    
    except Exception as e:
        return {"ok": False, "error": str(e)}
```

---

## 10. Memory / Remember Things

**What:** "Remember that I like coffee at 8am", "What's my favorite color?"

**Simple version (JSON file):**

```python
import json
from pathlib import Path

MEMORY_FILE = Path.home() / "fido_memory.json"

@_registry.register(
    name="remember",
    description="Store information for later recall",
    owner_only=True,
)
async def remember(key: str, value: str) -> dict[str, Any]:
    """
    Remember a fact about the user.
    
    Args:
        key: What to remember (e.g. "favorite_color", "morning_routine")
        value: The information
    """
    memory = {}
    if MEMORY_FILE.exists():
        memory = json.loads(MEMORY_FILE.read_text())
    
    memory[key] = value
    MEMORY_FILE.write_text(json.dumps(memory, indent=2))
    
    return {"ok": True, "result": f"I'll remember that {key} = {value}"}


@_registry.register(
    name="recall",
    description="Recall previously stored information",
    owner_only=True,
)
async def recall(key: str | None = None) -> dict[str, Any]:
    """
    Recall information about the user.
    
    Args:
        key: What to recall (or None for all memories)
    """
    if not MEMORY_FILE.exists():
        return {"ok": True, "memories": {}}
    
    memory = json.loads(MEMORY_FILE.read_text())
    
    if key:
        value = memory.get(key)
        if value:
            return {"ok": True, "result": f"{key} = {value}"}
        else:
            return {"ok": False, "error": f"I don't remember anything about {key}"}
    else:
        return {"ok": True, "memories": memory}
```

**Advanced version (with Qdrant):**

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

# Initialize once
qdrant = QdrantClient(url="http://localhost:6333")
encoder = SentenceTransformer('all-MiniLM-L6-v2')

@_registry.register(
    name="remember_fact",
    description="Remember important facts using semantic memory",
    owner_only=True,
)
async def remember_fact(fact: str) -> dict[str, Any]:
    """Store a fact in semantic memory for later retrieval."""
    
    # Encode fact to vector
    vector = encoder.encode(fact).tolist()
    
    # Store in Qdrant
    qdrant.upsert(
        collection_name="fido_memory",
        points=[
            PointStruct(
                id=hash(fact) % (10 ** 8),  # Simple ID from hash
                vector=vector,
                payload={"fact": fact, "timestamp": time.time()}
            )
        ]
    )
    
    return {"ok": True, "result": "Fact stored in memory"}


@_registry.register(
    name="search_memory",
    description="Search memory for relevant facts",
    owner_only=True,
)
async def search_memory(query: str, limit: int = 5) -> dict[str, Any]:
    """Search memory for facts relevant to the query."""
    
    # Encode query
    vector = encoder.encode(query).tolist()
    
    # Search
    results = qdrant.search(
        collection_name="fido_memory",
        query_vector=vector,
        limit=limit
    )
    
    facts = [hit.payload["fact"] for hit in results]
    
    return {"ok": True, "relevant_facts": facts}
```

---

## Quick Start Template

Copy this into `tools.py` to add a new tool:

```python
@_registry.register(
    name="my_tool",
    description="What this tool does",
    owner_only=True,  # or False for guest access
)
async def my_tool(param1: str, param2: int = 10) -> dict[str, Any]:
    """
    Tool description for the AI.
    
    Args:
        param1: Description
        param2: Description with default
    
    Examples:
        - "do something with XYZ"
        - "activate the thing"
    """
    try:
        # Your logic here
        result = do_something(param1, param2)
        
        return {
            "ok": True,
            "result": result
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }
```

---

## Pro Tips

1. **Keep tools focused** - One tool = one purpose
2. **Use n8n for complex workflows** - Don't reinvent the wheel
3. **Return structured data** - `{"ok": bool, "result": ...}`
4. **Add good descriptions** - The AI reads them!
5. **Handle errors gracefully** - Always return something useful
6. **Test with simple commands first** - "list my files" before "analyze my shopping patterns"

---

## Environment Variables

Add to your `.env`:

```env
# Web Search
GOOGLE_SEARCH_API_KEY=...
GOOGLE_SEARCH_ENGINE_ID=...
# or
TAVILY_API_KEY=...

# OBS
OBS_WEBSOCKET_HOST=localhost
OBS_WEBSOCKET_PORT=4455
OBS_WEBSOCKET_PASSWORD=...

# Twitch
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_CHANNEL=...

# Qdrant (if using vector memory)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
```

Happy building! 🚀

