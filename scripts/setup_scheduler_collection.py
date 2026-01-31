#!/usr/bin/env python3
"""
Setup script for the scheduled_tasks Appwrite collection.

This script creates all necessary attributes and indexes for the scheduler.

Usage:
    python scripts/setup_scheduler_collection.py
"""

import sys
import os

# Add parent directory to path so we can import from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.exception import AppwriteException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get settings
APPWRITE_ENDPOINT = os.getenv("APPWRITE_ENDPOINT")
APPWRITE_PROJECT = os.getenv("APPWRITE_CLONE_PROJECT")
APPWRITE_API_KEY = os.getenv("APPWRITE_CLONE_API_KEY")
APPWRITE_DB_ID = os.getenv("APPWRITE_CLONE_DB_ID")
COLLECTION_ID = os.getenv("APPWRITE_SCHEDULED_TASKS_COLL_ID") or "scheduled_tasks"


def create_attributes():
    """Create all attributes for the scheduled_tasks collection."""
    
    print(f"🔧 Setting up Appwrite collection: {COLLECTION_ID}")
    print(f"📍 Endpoint: {APPWRITE_ENDPOINT}")
    print(f"📦 Database: {APPWRITE_DB_ID}")
    print()
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT)
    client.set_key(APPWRITE_API_KEY)
    
    databases = Databases(client)
    
    # Define attributes
    attributes = [
        {
            "key": "taskId",
            "type": "string",
            "size": 50,
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "userId",
            "type": "string",
            "size": 50,
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "taskName",
            "type": "string",
            "size": 200,
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "action",
            "type": "string",
            "size": 50,
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "args",
            "type": "string",
            "size": 2000,
            "required": True,
            "default": "{}",
            "array": False
        },
        {
            "key": "scheduledFor",
            "type": "datetime",
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "priority",
            "type": "string",
            "size": 20,
            "required": True,
            "default": "MEDIUM",
            "array": False
        },
        {
            "key": "status",
            "type": "string",
            "size": 20,
            "required": True,
            "default": "pending",
            "array": False
        },
        {
            "key": "createdAt",
            "type": "datetime",
            "required": True,
            "default": None,
            "array": False
        },
        {
            "key": "executedAt",
            "type": "datetime",
            "required": False,
            "default": None,
            "array": False
        },
        {
            "key": "error",
            "type": "string",
            "size": 500,
            "required": False,
            "default": None,
            "array": False
        }
    ]
    
    # Create each attribute
    print("Creating attributes...")
    for attr in attributes:
        try:
            key = attr["key"]
            attr_type = attr["type"]
            
            if attr_type == "string":
                result = databases.create_string_attribute(
                    database_id=APPWRITE_DB_ID,
                    collection_id=COLLECTION_ID,
                    key=key,
                    size=attr["size"],
                    required=attr["required"],
                    default=attr.get("default"),
                    array=attr["array"]
                )
            elif attr_type == "datetime":
                result = databases.create_datetime_attribute(
                    database_id=APPWRITE_DB_ID,
                    collection_id=COLLECTION_ID,
                    key=key,
                    required=attr["required"],
                    default=attr.get("default"),
                    array=attr.get("array", False)
                )
            
            print(f"  ✅ Created: {key} ({attr_type})")
            
        except AppwriteException as e:
            if "already exists" in str(e).lower() or "attribute" in str(e).lower():
                print(f"  ⚠️  Already exists: {key}")
            else:
                print(f"  ❌ Error creating {key}: {e}")
                raise
    
    print()
    print("⏳ Waiting for attributes to become available...")
    print("   (Appwrite processes attributes asynchronously)")
    print()
    print("✅ Attributes created successfully!")
    print()
    print("📋 Next steps:")
    print("   1. Wait ~30 seconds for Appwrite to process attributes")
    print("   2. Start the scheduler: POST /clone/scheduler/start")
    print("   3. Test: 'Send me a notification in 1 minute'")
    print()


def create_indexes():
    """Create indexes for better query performance."""
    
    print("Creating indexes...")
    
    client = Client()
    client.set_endpoint(APPWRITE_ENDPOINT)
    client.set_project(APPWRITE_PROJECT)
    client.set_key(APPWRITE_API_KEY)
    
    databases = Databases(client)
    
    indexes = [
        {
            "key": "status_index",
            "type": "key",
            "attributes": ["status"],
            "orders": ["ASC"]
        },
        {
            "key": "user_status",
            "type": "key",
            "attributes": ["userId", "status"],
            "orders": ["ASC", "ASC"]
        },
        {
            "key": "scheduled_time",
            "type": "key",
            "attributes": ["scheduledFor"],
            "orders": ["ASC"]
        }
    ]
    
    for idx in indexes:
        try:
            result = databases.create_index(
                database_id=APPWRITE_DB_ID,
                collection_id=COLLECTION_ID,
                key=idx["key"],
                type=idx["type"],
                attributes=idx["attributes"],
                orders=idx.get("orders")
            )
            print(f"  ✅ Created index: {idx['key']}")
        except AppwriteException as e:
            if "already exists" in str(e).lower():
                print(f"  ⚠️  Index already exists: {idx['key']}")
            else:
                print(f"  ❌ Error creating index {idx['key']}: {e}")
    
    print()
    print("✅ Indexes created successfully!")
    print()


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("  Appwrite Scheduler Collection Setup")
    print("=" * 60)
    print()
    
    # Check if collection exists
    try:
        client = Client()
        client.set_endpoint(APPWRITE_ENDPOINT)
        client.set_project(APPWRITE_PROJECT)
        client.set_key(APPWRITE_API_KEY)
        
        databases = Databases(client)
        collection = databases.get_collection(
            database_id=APPWRITE_DB_ID,
            collection_id=COLLECTION_ID
        )
        
        print(f"✅ Collection '{COLLECTION_ID}' found!")
        print()
        
    except AppwriteException as e:
        print(f"❌ Collection '{COLLECTION_ID}' not found!")
        print(f"   Please create the collection in Appwrite Console first.")
        print(f"   Error: {e}")
        sys.exit(1)
    
    # Create attributes
    try:
        create_attributes()
    except Exception as e:
        print(f"❌ Failed to create attributes: {e}")
        sys.exit(1)
    
    # Ask if user wants to create indexes
    print("Would you like to create indexes? (recommended)")
    response = input("Create indexes? [Y/n]: ").strip().lower()
    
    if response in ["", "y", "yes"]:
        try:
            create_indexes()
        except Exception as e:
            print(f"⚠️  Failed to create indexes (non-critical): {e}")
    
    print()
    print("=" * 60)
    print("  Setup Complete! 🎉")
    print("=" * 60)
    print()
    print("Your scheduler is ready to use!")
    print()
