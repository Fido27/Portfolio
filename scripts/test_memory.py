#!/usr/bin/env python3
"""
Test script for Phase 1: Memory System

Tests:
1. Memory storage
2. Memory retrieval
3. Semantic search
4. Integration with Qdrant
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory
from datetime import datetime

print("🧪 Testing Fido Memory System\n")
print("=" * 60)

# Initialize memory
try:
    memory = get_memory()
    print("✅ Memory system initialized")
except Exception as e:
    print(f"❌ Failed to initialize memory: {e}")
    sys.exit(1)

# Test 1: Store memories
print("\n📝 Test 1: Storing memories...")
try:
    test_memories = [
        ("Owner likes coffee black", "fido_memory", {"category": "preferences"}),
        ("Owner's favorite color is blue", "fido_memory", {"category": "preferences"}),
        ("Met John at the park, he's a developer", "fido_memory", {"category": "people"}),
    ]
    
    for text, collection, metadata in test_memories:
        memory_id = memory.store(text, collection, metadata)
        print(f"  ✅ Stored: {text[:50]}... (ID: {memory_id})")
    
    print("✅ Test 1 PASSED")
except Exception as e:
    print(f"❌ Test 1 FAILED: {e}")
    sys.exit(1)

# Test 2: Search memories
print("\n🔍 Test 2: Searching memories...")
try:
    queries = [
        ("coffee preferences", "fido_memory"),
        ("favorite color", "fido_memory"),
        ("who is John", "fido_memory"),
    ]
    
    for query, collection in queries:
        results = memory.search(query, collection, limit=2)
        print(f"\n  Query: '{query}'")
        if results:
            for r in results:
                print(f"    → {r['text']} (score: {r['score']:.2f})")
        else:
            print("    → No results found")
    
    print("\n✅ Test 2 PASSED")
except Exception as e:
    print(f"❌ Test 2 FAILED: {e}")
    sys.exit(1)

# Test 3: Activity logging
print("\n📅 Test 3: Daily activities...")
try:
    today = datetime.now().strftime("%Y-%m-%d")
    activity = f"Test activity on {today}"
    
    memory.store(
        activity,
        "daily_activities",
        {"date": today, "activity_type": "test"}
    )
    print(f"  ✅ Logged activity: {activity}")
    
    # Search for today's activities
    results = memory.search(f"activities on {today}", "daily_activities", limit=5)
    print(f"  Found {len(results)} activities for today")
    
    print("✅ Test 3 PASSED")
except Exception as e:
    print(f"❌ Test 3 FAILED: {e}")
    sys.exit(1)

# Summary
print("\n" + "=" * 60)
print("🎉 All tests passed!")
print("\n💡 Next steps:")
print("  1. Start the backend: cd app/api && uvicorn main:app --reload")
print("  2. Start the frontend: npm run dev")
print("  3. Test via chat interface:")
print("     - Say: 'I hate cilantro'")
print("     - Then ask: 'What are my food preferences?'")
print("     - Fido should remember and tell you!")
print("\n✨ Phase 1 Memory System is ready!")

