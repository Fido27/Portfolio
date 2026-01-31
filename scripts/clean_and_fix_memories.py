#!/usr/bin/env python3
"""
Clean up old test memories and fix the onions memory.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory

print("🧹 Cleaning and fixing memories...\n")

memory = get_memory()

# IDs to delete (test memories + old onions)
ids_to_delete = [
    380013262,  # Owner likes coffee black (test)
    380412817,  # Owner's favorite color is blue (test)
    380804499,  # Met John at the park (test)
    407059925,  # User doesn't eat onions (needs fixing)
]

# Delete old memories
print("Deleting old/test memories...")
for point_id in ids_to_delete:
    try:
        memory.qdrant.delete(
            collection_name="fido_memory",
            points_selector=[point_id]
        )
        print(f"  ✅ Deleted memory ID: {point_id}")
    except Exception as e:
        print(f"  ⚠️  Could not delete {point_id}: {e}")

# Add corrected onions memory
print("\n📝 Adding corrected memory...")
try:
    memory.store(
        text="Aarav doesn't like onions",
        collection="fido_memory",
        metadata={"category": "preferences"}
    )
    print("  ✅ Added: Aarav doesn't like onions")
except Exception as e:
    print(f"  ❌ Error: {e}")

print("\n🎉 Done! Your memories are now personalized with 'Aarav'")
print("\n💡 From now on, Fido will automatically use 'Aarav' when:")
print("   - Storing: 'Aarav likes coffee black'")
print("   - Querying: 'does Aarav like onions'")

