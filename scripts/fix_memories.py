#!/usr/bin/env python3
"""
Script to view and update existing memories.

Useful for:
- Fixing old memories that use "User" instead of "Aarav"
- Viewing what's stored
- Cleaning up incorrect memories
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory
from qdrant_client.models import Filter, FieldCondition, MatchText

print("🔧 Memory Management Tool\n")
print("=" * 60)

memory = get_memory()

# Show all memories in fido_memory collection
print("\n📝 Current memories in 'fido_memory':\n")

try:
    # Scroll through all points
    results = memory.qdrant.scroll(
        collection_name="fido_memory",
        limit=100,
        with_vectors=False
    )
    
    points = results[0]
    
    if not points:
        print("  (No memories stored yet)")
    else:
        for i, point in enumerate(points, 1):
            text = point.payload.get('text', '')
            category = point.payload.get('category', 'unknown')
            print(f"{i}. [{category}] {text}")
            print(f"   ID: {point.id}")
            print()
    
    print("=" * 60)
    print(f"\nTotal: {len(points)} memories")
    
    # Offer to delete specific memories
    print("\n💡 To delete a memory:")
    print("   1. Note the ID above")
    print("   2. Use the Qdrant API or recreate with correct info")
    print("\n💡 Or just tell Fido the correct fact:")
    print("   'I don't like onions' (new memory will be stored as 'Aarav doesn't like onions')")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

