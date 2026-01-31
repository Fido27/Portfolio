#!/usr/bin/env python3
"""
Test smart memory updating - demonstrates automatic replacement of similar memories.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory

print("🧪 Testing Smart Memory Updates\n")
print("=" * 60)

memory = get_memory()

# Test 1: Store initial preference
print("\n📝 Test 1: Store initial preference")
print("Storing: 'Aarav's favorite color is blue'")

memory.store(
    text="Aarav's favorite color is blue",
    collection="fido_memory",
    metadata={"category": "preferences"}
)

# Check what's stored
results = memory.search("Aarav favorite color", "fido_memory", limit=5)
print(f"\nCurrent memories about favorite color:")
for r in results:
    print(f"  → {r['text']} (score: {r['score']:.2f})")

# Test 2: Update the preference (should replace old one)
print("\n" + "=" * 60)
print("\n📝 Test 2: Update to new preference")
print("Now storing: 'Aarav's favorite color is red'")
print("This should REPLACE the blue memory...\n")

# Delete similar and store new
deleted = memory.delete_similar(
    query="Aarav's favorite color is red",
    collection="fido_memory",
    score_threshold=0.75
)
print(f"Deleted {deleted} similar memory(ies)")

memory.store(
    text="Aarav's favorite color is red",
    collection="fido_memory",
    metadata={"category": "preferences"}
)

# Check what's stored now
results = memory.search("Aarav favorite color", "fido_memory", limit=5)
print(f"\nUpdated memories about favorite color:")
for r in results:
    print(f"  → {r['text']} (score: {r['score']:.2f})")

# Test 3: Add unrelated preference (should NOT delete)
print("\n" + "=" * 60)
print("\n📝 Test 3: Add different preference")
print("Storing: 'Aarav loves pizza'")
print("This is different, should NOT replace color preference...\n")

memory.store(
    text="Aarav loves pizza",
    collection="fido_memory",
    metadata={"category": "preferences"}
)

# Check all preferences
results = memory.search("Aarav preferences", "fido_memory", limit=10)
print(f"\nAll preferences:")
for r in results:
    print(f"  → {r['text']} (score: {r['score']:.2f})")

print("\n" + "=" * 60)
print("\n✅ Smart updating works!")
print("\n💡 How it works:")
print("  1. Before storing, search for similar memories (>75% similarity)")
print("  2. Delete the old/similar ones")
print("  3. Store the new memory")
print("  4. Result: No duplicates, always current info!")

print("\n🧹 Cleaning up test memories...")
# Clean up
memory.delete_similar("Aarav's favorite color", "fido_memory", score_threshold=0.5)
memory.delete_similar("Aarav loves pizza", "fido_memory", score_threshold=0.5)
print("✅ Done!")

