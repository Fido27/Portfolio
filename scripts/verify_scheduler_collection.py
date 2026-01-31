#!/usr/bin/env python3
"""
Verify scheduled_tasks collection attributes.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from appwrite.client import Client
from appwrite.services.databases import Databases
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
print(f"  Checking collection: {COLLECTION_ID}")
print("="*60 + "\n")

# Get collection details
try:
    collection = databases.get_collection(
        database_id=APPWRITE_DB_ID,
        collection_id=COLLECTION_ID
    )
    
    attributes = collection.get('attributes', [])
    
    print(f"Found {len(attributes)} attributes:\n")
    
    # Required attributes
    required_attrs = {
        "taskId": "string",
        "userId": "string", 
        "taskName": "string",
        "action": "string",
        "args": "string",
        "scheduledFor": "datetime",
        "priority": "string",
        "status": "string",
        "createdAt": "datetime",
        "executedAt": "datetime",
        "error": "string"
    }
    
    existing = {}
    for attr in attributes:
        key = attr.get('key')
        attr_type = attr.get('type')
        status = attr.get('status', 'available')
        required = attr.get('required', False)
        
        existing[key] = attr_type
        
        status_icon = "✅" if status == "available" else "⏳"
        req_text = "required" if required else "optional"
        
        print(f"{status_icon} {key:15} {attr_type:10} ({req_text}) - {status}")
    
    print("\n" + "="*60)
    print("  Missing Attributes Check")
    print("="*60 + "\n")
    
    missing = []
    for key, expected_type in required_attrs.items():
        if key not in existing:
            missing.append(key)
            print(f"❌ MISSING: {key} ({expected_type})")
    
    if not missing:
        print("✅ All required attributes exist!")
    else:
        print(f"\n⚠️  {len(missing)} attributes are missing")
        print("\nTo create missing attributes, run:")
        print("  python scripts/setup_scheduler_collection.py")
    
    print()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
