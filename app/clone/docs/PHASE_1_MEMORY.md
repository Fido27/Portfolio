# 🧠 PHASE 1: Memory & RAG System

**Detailed implementation guide for adding long-term memory to Fido.**

Reference: MASTER_PLAN.md

---

## 🎯 Goal

Give Fido perfect memory using RAG (Retrieval-Augmented Generation):
- Remember facts about you (preferences, habits, relationships)
- Store daily activities (from background monitor)
- Search memory semantically ("what did I eat for breakfast?")
- Build context over time
- Smart home entity lookup (entity IDs from friendly names)

---

## 📋 Checklist

- [ ] 1. Install Qdrant (local or cloud)
- [ ] 2. Create Qdrant collections
- [ ] 3. Create `memory.py` module
- [ ] 4. Add memory tools to `tools.py`
- [ ] 5. Update system prompts to use memory
- [ ] 6. Test memory storage and retrieval
- [ ] 7. Pre-populate with useful data

---

## 🚀 Step-by-Step Implementation

### **Step 1: Install Qdrant**

**Option A: Docker (Recommended)**
```bash
docker pull qdrant/qdrant
docker run -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
```

**Option B: Cloud**
- Go to https://cloud.qdrant.io
- Create cluster
- Copy URL and API key

**Option C: Local Binary**
```bash
# Download from https://github.com/qdrant/qdrant/releases
./qdrant
```

**Test connection:**
```bash
curl http://localhost:6333
# Should return: {"title":"qdrant - vector search engine",...}
```

---

### **Step 2: Install Python Packages**

```bash
pip install qdrant-client sentence-transformers
```

**Add to `.env`:**
```env
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=...  # Only if using cloud
```

---

### **Step 3: Create Collections**

**Create:** `scripts/setup_qdrant.py`

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(url="http://localhost:6333")

# Collection 1: General memories
client.create_collection(
    collection_name="fido_memory",
    vectors_config=VectorParams(
        size=384,  # all-MiniLM-L6-v2 embedding size
        distance=Distance.COSINE
    )
)

# Collection 2: Daily activities
client.create_collection(
    collection_name="daily_activities",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# Collection 3: Smart home entities
client.create_collection(
    collection_name="home_entities",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# Collection 4: Conversation history
client.create_collection(
    collection_name="conversations",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

print("✅ Qdrant collections created!")
```

**Run it:**
```bash
python scripts/setup_qdrant.py
```

---

### **Step 4: Create Memory Module**

**Create:** `app/api/clone/memory.py`

```python
from __future__ import annotations

import time
from functools import lru_cache
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from sentence_transformers import SentenceTransformer

from .settings import get_settings


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client (cached)"""
    s = get_settings()
    
    if hasattr(s, 'QDRANT_API_KEY') and s.QDRANT_API_KEY:
        return QdrantClient(
            url=s.QDRANT_URL,
            api_key=s.QDRANT_API_KEY
        )
    else:
        return QdrantClient(url=s.QDRANT_URL)


@lru_cache(maxsize=1)
def get_encoder() -> SentenceTransformer:
    """Get sentence encoder (cached)"""
    return SentenceTransformer('all-MiniLM-L6-v2')


class Memory:
    """
    Long-term memory system using Qdrant vector database.
    
    Enables Fido to:
    - Remember facts about owner
    - Store and retrieve daily activities
    - Build context over time
    - Search semantically (not just keyword matching)
    """
    
    def __init__(self):
        self.qdrant = get_qdrant_client()
        self.encoder = get_encoder()
    
    def store(
        self,
        text: str,
        collection: str,
        metadata: dict[str, Any] | None = None
    ) -> str:
        """
        Store a memory in vector database.
        
        Args:
            text: The memory text to store
            collection: Which collection (fido_memory, daily_activities, etc.)
            metadata: Additional data (category, timestamp, etc.)
        
        Returns:
            Memory ID
        """
        # Generate vector embedding
        vector = self.encoder.encode(text).tolist()
        
        # Create unique ID
        point_id = int(time.time() * 1000000) % (10 ** 9)
        
        # Store in Qdrant
        self.qdrant.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "text": text,
                        "timestamp": time.time(),
                        **(metadata or {})
                    }
                )
            ]
        )
        
        return str(point_id)
    
    def search(
        self,
        query: str,
        collection: str,
        limit: int = 5,
        score_threshold: float = 0.5
    ) -> list[dict[str, Any]]:
        """
        Search memories semantically.
        
        Args:
            query: What to search for
            collection: Which collection to search
            limit: Max results
            score_threshold: Minimum similarity score (0-1)
        
        Returns:
            List of matching memories with scores
        """
        # Generate query vector
        query_vector = self.encoder.encode(query).tolist()
        
        # Search
        results = self.qdrant.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold
        )
        
        return [
            {
                "text": hit.payload["text"],
                "score": hit.score,
                "metadata": {k: v for k, v in hit.payload.items() if k != "text"}
            }
            for hit in results
        ]
    
    def get_recent(
        self,
        collection: str,
        limit: int = 10
    ) -> list[dict[str, Any]]:
        """Get most recent memories (by timestamp)"""
        
        results = self.qdrant.scroll(
            collection_name=collection,
            limit=limit,
            with_vectors=False,
            order_by="timestamp"
        )
        
        return [
            {
                "text": point.payload["text"],
                "metadata": point.payload
            }
            for point in results[0]  # results is tuple (points, next_offset)
        ]


@lru_cache(maxsize=1)
def get_memory() -> Memory:
    """Get global memory instance"""
    return Memory()
```

---

### **Step 5: Add Memory Tools**

**Add to:** `app/api/clone/tools.py`

```python
from .memory import get_memory
from datetime import datetime


@_registry.register(
    name="remember_fact",
    description="Store important information in long-term memory",
    owner_only=True
)
async def remember_fact(
    fact: str,
    category: str = "general"
) -> dict[str, Any]:
    """
    Remember important facts, preferences, events.
    
    Categories:
    - preferences: Likes/dislikes (coffee preference, music taste)
    - people: Information about people (friends, family)
    - places: Locations and their details
    - events: Important events that happened
    - habits: Daily routines and patterns
    - general: Everything else
    
    Examples:
    - remember_fact("Owner likes coffee black", "preferences")
    - remember_fact("Met John at the park, he's a developer", "people")
    - remember_fact("Favorite restaurant is Olive Garden", "places")
    """
    memory = get_memory()
    
    memory_id = memory.store(
        text=fact,
        collection="fido_memory",
        metadata={
            "category": category,
            "date": datetime.now().strftime("%Y-%m-%d")
        }
    )
    
    return {
        "ok": True,
        "result": f"Remembered: {fact}",
        "memory_id": memory_id
    }


@_registry.register(
    name="recall_memory",
    description="Search long-term memory for relevant information",
    owner_only=True
)
async def recall_memory(
    query: str,
    category: str | None = None,
    limit: int = 5
) -> dict[str, Any]:
    """
    Search your memory for relevant facts.
    
    Use this when:
    - Owner asks about past events
    - You need context about preferences
    - Looking up information you should know
    
    Examples:
    - recall_memory("owner's coffee preference")
    - recall_memory("what happened yesterday")
    - recall_memory("who is John", category="people")
    """
    memory = get_memory()
    
    results = memory.search(
        query=query,
        collection="fido_memory",
        limit=limit
    )
    
    # Filter by category if specified
    if category:
        results = [r for r in results if r["metadata"].get("category") == category]
    
    return {
        "ok": True,
        "memories": [r["text"] for r in results],
        "scores": [r["score"] for r in results],
        "count": len(results)
    }


@_registry.register(
    name="get_todays_activities",
    description="Get what owner did today",
    owner_only=True
)
async def get_todays_activities() -> dict[str, Any]:
    """
    Retrieve activities logged today.
    
    Returns things like:
    - "Had eggs for breakfast at 8am"
    - "Worked out at gym 7-8am"
    - "Meeting with John at 2pm"
    - "Watched The Matrix 9-11pm"
    """
    memory = get_memory()
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    results = memory.search(
        query=f"activities on {today}",
        collection="daily_activities",
        limit=50
    )
    
    return {
        "ok": True,
        "date": today,
        "activities": [r["text"] for r in results],
        "count": len(results)
    }


@_registry.register(
    name="search_home_entity",
    description="Find Home Assistant entity ID from friendly name",
    owner_only=True
)
async def search_home_entity(
    device_name: str,
    room: str | None = None
) -> dict[str, Any]:
    """
    Find entity ID for smart home devices.
    
    Examples:
    - search_home_entity("bedroom light")
    - search_home_entity("living room tv", room="living room")
    
    Returns entity_id to use with Home Assistant
    """
    memory = get_memory()
    
    query = f"{room} {device_name}" if room else device_name
    
    results = memory.search(
        query=query,
        collection="home_entities",
        limit=1
    )
    
    if not results:
        return {
            "ok": False,
            "error": f"Could not find entity for: {device_name}"
        }
    
    entity_id = results[0]["metadata"].get("entity_id")
    
    return {
        "ok": True,
        "entity_id": entity_id,
        "friendly_name": device_name,
        "match_score": results[0]["score"]
    }
```

---

### **Step 6: Update System Prompts**

**Update:** `app/api/clone/persona.py`

```python
def system_prompt_for_persona(persona_id: str) -> str:
    if persona_id == "fido":
        return """
You are Fido: friendly, helpful, and loyal AI companion.

🧠 MEMORY SYSTEM:
You have perfect memory through tools. Use them intelligently!

When to use memory tools:
1. 'recall_memory' - When owner asks about past events, preferences, or people
2. 'remember_fact' - When you learn something important about owner
3. 'get_todays_activities' - To know what owner did today
4. 'search_home_entity' - To find entity IDs for smart home control

ALWAYS check memory before saying "I don't know" or "I don't remember"!

EXAMPLES:

User: "What did I eat for breakfast?"
You: [Call recall_memory("breakfast today")]
     → Finds: "Had eggs and toast at 8:15 AM"
     → Respond: "You had eggs and toast at 8:15 this morning!"

User: "Turn on my bedroom light"
You: [Call search_home_entity("bedroom light")]
     → Finds: entity_id="light.bedroom_main"
     → [Call smart_home_control("turn on light.bedroom_main")]
     → Respond: "Bedroom light is on!"

User: "I really hate cilantro"
You: [Call remember_fact("hates cilantro", "preferences")]
     → Respond: "Got it! I'll remember you hate cilantro."

User: "How was my day?"
You: [Call get_todays_activities()]
     → Finds: workout 7am, meeting 2pm, pasta dinner 7pm
     → Respond: "Pretty good day! You worked out this morning, 
        had that 2pm meeting, and made pasta for dinner. 
        How'd the meeting go?"

🎯 PERSONALITY:
- Proactive and caring (not just reactive)
- Remember details (shows you pay attention)
- Ask follow-up questions
- Celebrate wins, support through challenges
- Be genuinely interested in owner's life

🚫 DON'T:
- Pretend to remember if memory search returns nothing
- Make up facts - always use tools to check
- Over-use memory (not every response needs a memory search)
"""
```

---

### **Step 7: Pre-populate Collections**

**Create:** `scripts/seed_memory.py`

```python
from app.api.clone.memory import get_memory
from datetime import datetime

memory = get_memory()

# Seed some preferences (customize these!)
preferences = [
    "Owner likes coffee black, no sugar",
    "Owner prefers dark mode on all apps",
    "Owner is allergic to peanuts",
    "Owner's favorite color is blue",
    "Owner likes sci-fi movies and action games",
]

for pref in preferences:
    memory.store(
        text=pref,
        collection="fido_memory",
        metadata={"category": "preferences"}
    )

# Seed smart home entities (from your Home Assistant)
entities = [
    {"name": "bedroom light", "entity_id": "light.bedroom_main", "room": "bedroom"},
    {"name": "living room lights", "entity_id": "light.living_room_group", "room": "living room"},
    {"name": "front door lock", "entity_id": "lock.front_door", "room": "entry"},
    # Add all your devices!
]

for entity in entities:
    memory.store(
        text=f"{entity['room']} {entity['name']}",
        collection="home_entities",
        metadata=entity
    )

print(f"✅ Seeded {len(preferences)} preferences")
print(f"✅ Seeded {len(entities)} smart home entities")
```

**Run it:**
```bash
python scripts/seed_memory.py
```

---

## 🧪 **Testing**

### **Test 1: Basic Memory**

Chat with Fido:
```
You: "I hate pineapple on pizza"
Fido: [Calls remember_fact("hates pineapple on pizza", "preferences")]
      "Got it! I'll remember you hate pineapple on pizza."

You: "What are my food preferences?"
Fido: [Calls recall_memory("food preferences")]
      "Let me check... You like coffee black, you're allergic to 
       peanuts, and you hate pineapple on pizza!"
```

### **Test 2: Smart Home**

```
You: "Turn on the bedroom light"
Fido: [Calls search_home_entity("bedroom light")]
      → Gets: entity_id="light.bedroom_main"
      [Calls smart_home_control("turn on light.bedroom_main")]
      "Bedroom light is on!"
```

### **Test 3: Daily Activities** (After monitor is built)

```
You: "What did I do today?"
Fido: [Calls get_todays_activities()]
      "Let's see... you worked out at 7am, had a meeting at 2pm, 
       and cooked pasta for dinner around 7pm. Pretty productive day!"
```

---

## 📊 **Success Criteria**

Phase 1 is complete when:

- [x] Qdrant is running and accessible
- [x] Collections are created
- [x] `memory.py` module works
- [x] Memory tools are registered
- [x] Fido uses memory tools in conversation
- [x] Preferences persist across sessions
- [x] Smart home entity lookup works
- [x] No errors or crashes

---

## 🐛 **Troubleshooting**

**Qdrant not connecting:**
```bash
# Check if running
curl http://localhost:6333

# Check Docker
docker ps | grep qdrant

# Check logs
docker logs <container_id>
```

**Embeddings slow:**
```python
# First run downloads model (~80MB)
# Subsequent runs use cached model
# Should take <100ms per embedding
```

**Memory not retrieving:**
```python
# Check collection exists
client.get_collection("fido_memory")

# Check points exist
client.count("fido_memory")

# Test search directly
results = memory.search("test", "fido_memory")
print(results)
```

---

## 🎯 **Next Steps**

Once Phase 1 is complete:
1. Use Fido daily with memory
2. Notice what it remembers and what it forgets
3. Iterate on prompts
4. Add more categories as needed
5. Move to Phase 2 (Voice) when ready!

---

## 💡 **Tips**

1. **Start with small memory** - Don't store everything, just important facts
2. **Good categories** - Makes retrieval more accurate
3. **Test retrieval often** - Make sure memory search is finding right things
4. **Update prompts** - Tune when Fido should use memory tools
5. **Monitor Qdrant size** - Clean up old/irrelevant memories periodically

---

## 📚 **Resources**

- Qdrant docs: https://qdrant.tech/documentation/
- Sentence Transformers: https://www.sbert.net/
- Vector search concepts: https://www.pinecone.io/learn/vector-database/

---

**Ready to give Fido perfect memory!** 🧠✨

