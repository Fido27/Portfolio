#!/usr/bin/env python3
"""
Setup Qdrant collections for Fido AI Memory System.

This script creates the necessary vector database collections
for Phase 1: Memory & RAG System.

Run this once before using memory features:
    python scripts/setup_qdrant.py
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

# Initialize client
if QDRANT_API_KEY:
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
else:
    client = QdrantClient(url=QDRANT_URL)

print(f"🔌 Connected to Qdrant at {QDRANT_URL}")

# Vector size for Google text-embedding-004 model
VECTOR_SIZE = 768

collections = [
    {
        "name": "fido_memory",
        "description": "General memories, facts, preferences, and learnings"
    },
    {
        "name": "daily_activities",
        "description": "Daily activities logged by background monitor"
    },
    {
        "name": "conversations",
        "description": "Conversation history for semantic search"
    }
    # Note: Smart home integration (hass_entities) will be added later via MQTT
]

for coll in collections:
    name = coll["name"]
    desc = coll["description"]
    
    try:
        # Check if collection already exists
        existing = client.get_collections()
        collection_names = [c.name for c in existing.collections]
        
        if name in collection_names:
            print(f"✅ Collection '{name}' already exists - skipping")
            continue
        
        # Create collection
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"✅ Created collection '{name}'")
        print(f"   → {desc}")
        
    except Exception as e:
        print(f"❌ Error creating '{name}': {e}")

print("\n🎉 Qdrant setup complete!")
print("\nCollections created:")
for coll in collections:
    print(f"  • {coll['name']}")

print("\n💡 Next steps:")
print("  1. Create app/api/clone/memory.py")
print("  2. Add memory tools to app/api/clone/tools.py")
print("  3. Update system prompts in app/api/clone/persona.py")

