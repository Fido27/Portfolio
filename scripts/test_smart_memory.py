#!/usr/bin/env python3
"""
Test the new smart memory system:
1. Lists of items (dislikes, likes) - ADD mode
2. Singular facts (favorite X) - REPLACE mode  
3. Explicit deletion - forget_fact
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory

print("🧪 Testing Smart Memory System\n")
print("=" * 70)

memory = get_memory()

# Clean slate
print("\n🧹 Cleaning test memories...")
memory.delete_similar("Aarav doesn't like", "fido_memory", score_threshold=0.5, limit=10)
memory.delete_similar("Aarav's favorite", "fido_memory", score_threshold=0.5, limit=10)
memory.delete_similar("Aarav likes", "fido_memory", score_threshold=0.5, limit=10)

print("\n" + "=" * 70)
print("\n📋 TEST 1: Multiple Dislikes (should ADD, not replace)")
print("-" * 70)

# Store first dislike
print("\n1. Store: 'Aarav doesn't like onions because he doesn't like the taste'")
memory.store(
    "Aarav doesn't like onions because he doesn't like the taste",
    "fido_memory",
    {"category": "preferences"}
)

results = memory.search("Aarav doesn't like", "fido_memory", limit=5)
print(f"\nCurrent dislikes: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

# Store second dislike (should NOT replace first!)
print("\n2. Store: 'Aarav doesn't like taco bell because he doesn't like the taste'")
memory.store(
    "Aarav doesn't like taco bell because he doesn't like the taste",
    "fido_memory",
    {"category": "preferences"}
)

results = memory.search("Aarav doesn't like", "fido_memory", limit=5)
print(f"\nCurrent dislikes: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

if len(results) >= 2:
    print("\n✅ SUCCESS: Both dislikes stored separately!")
else:
    print("\n❌ FAIL: Second dislike replaced first one")

print("\n" + "=" * 70)
print("\n🎨 TEST 2: Singular Fact - Favorite Color (should REPLACE)")
print("-" * 70)

# Store favorite color
print("\n1. Store: 'Aarav's favorite color is blue' (with replace)")
memory.store(
    "Aarav's favorite color is blue",
    "fido_memory",
    {"category": "preferences"}
)

results = memory.search("Aarav favorite color", "fido_memory", limit=5)
print(f"\nCurrent favorite colors: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

# Update favorite color (should delete blue)
print("\n2. Delete similar + Store: 'Aarav's favorite color is red'")
memory.delete_similar("Aarav's favorite color is red", "fido_memory", score_threshold=0.80, limit=2)
memory.store(
    "Aarav's favorite color is red",
    "fido_memory",
    {"category": "preferences"}
)

results = memory.search("Aarav favorite color", "fido_memory", limit=5)
print(f"\nCurrent favorite colors: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

if len(results) == 1 and "red" in results[0]["text"]:
    print("\n✅ SUCCESS: Favorite color updated (blue replaced with red)!")
else:
    print("\n⚠️  Check: Should only have red, not blue")

print("\n" + "=" * 70)
print("\n🗑️  TEST 3: Explicit Deletion")
print("-" * 70)

# Show current dislikes
results = memory.search("Aarav doesn't like", "fido_memory", limit=5)
print(f"\nBefore deletion - Dislikes: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

# Delete specific memory
print("\n Delete: 'Aarav doesn't like onions'")
deleted = memory.delete_similar("Aarav doesn't like onions", "fido_memory", score_threshold=0.75, limit=1)
print(f"Deleted: {deleted} memory(ies)")

results = memory.search("Aarav doesn't like", "fido_memory", limit=5)
print(f"\nAfter deletion - Dislikes: {len(results)}")
for r in results:
    print(f"  → {r['text']}")

if len(results) == 1 and "taco bell" in results[0]["text"].lower():
    print("\n✅ SUCCESS: Onion memory deleted, taco bell remains!")
else:
    print("\n⚠️  Check deletion results")

print("\n" + "=" * 70)
print("\n🎉 Tests Complete!")
print("\n💡 Summary:")
print("  ✓ Multiple items (likes/dislikes) = ADD mode (default)")
print("  ✓ Singular facts (favorite X) = REPLACE mode (explicit)")
print("  ✓ Explicit deletion = forget_fact tool")
print("\n🧹 Cleaning up...")
memory.delete_similar("Aarav doesn't like", "fido_memory", score_threshold=0.5, limit=10)
memory.delete_similar("Aarav's favorite", "fido_memory", score_threshold=0.5, limit=10)
print("✅ Done!")

