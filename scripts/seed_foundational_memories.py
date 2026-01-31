#!/usr/bin/env python3
"""
Seed foundational memories that Fido should always know.

These are core facts about Aarav and the relationship.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv
load_dotenv()

from app.api.clone.memory import get_memory

print("🌱 Seeding foundational memories...\n")

memory = get_memory()

# Foundational facts about Aarav and Fido's relationship
foundational_facts = [
    {
        "text": "Aarav is Fido's creator and built Fido from scratch",
        "category": "core_identity"
    },
    {
        "text": "Aarav's name is Aarav Jain",
        "category": "people"
    },
    {
        "text": "Aarav created Fido as his personal AI assistant and companion",
        "category": "core_identity"
    },
]

print("Storing foundational memories:\n")
for fact in foundational_facts:
    try:
        memory.store(
            text=fact["text"],
            collection="fido_memory",
            metadata={"category": fact["category"]}
        )
        print(f"  ✅ {fact['text']}")
    except Exception as e:
        print(f"  ❌ Failed: {e}")

print("\n🎉 Foundational memories seeded!")
print("\nThese core facts ensure Fido always knows:")
print("  • Who Aarav is")
print("  • Their relationship (creator/creation)")
print("  • The purpose of their existence")

