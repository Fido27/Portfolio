#!/usr/bin/env python3
"""
Create the 3 missing attributes for scheduled_tasks collection.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
from dotenv import load_dotenv

load_dotenv()

APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
APPWRITE_PROJECT = os.getenv("APPWRITE_CLONE_PROJECT")
APPWRITE_API_KEY = os.getenv("APPWRITE_CLONE_API_KEY")
APPWRITE_DB_ID = os.getenv("APPWRITE_CLONE_DB_ID")
COLLECTION_ID = os.getenv("APPWRITE_SCHEDULED_TASKS_COLL_ID") or "scheduled_tasks"

client = Client()
client.set_endpoint(APPWRITE_ENDPOINT)
client.set_project(APPWRITE_PROJECT)
client.set_key(APPWRITE_API_KEY)

databases = Databases(client)

print("\n" + "="*60)
print("  Creating Missing Attributes")
print("="*60 + "\n")

# The 3 missing attributes - MUST BE OPTIONAL to have default values in Appwrite
missing = [
    {
        "key": "args",
        "size": 2000,
        "required": False,  # Changed to False to allow default
        "default": "{}"
    },
    {
        "key": "priority",
        "size": 20,
        "required": False,  # Changed to False to allow default
        "default": "MEDIUM"
    },
    {
        "key": "status",
        "size": 20,
        "required": False,  # Changed to False to allow default
        "default": "pending"
    }
]

for attr in missing:
    try:
        result = databases.create_string_attribute(
            database_id=APPWRITE_DB_ID,
            collection_id=COLLECTION_ID,
            key=attr["key"],
            size=attr["size"],
            required=attr["required"],
            default=attr["default"],
            array=False
        )
        print(f"✅ Created: {attr['key']} (default: {attr['default']})")
    except AppwriteException as e:
        print(f"❌ Error creating {attr['key']}: {e}")

print("\n✅ Done! All attributes should now be created.")
print("⏳ Wait ~30 seconds for Appwrite to process them, then verify again.\n")
