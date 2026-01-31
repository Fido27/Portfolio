"""
Minimal Appwrite store for scheduler persistence.
"""
from functools import lru_cache
from appwrite.client import Client
from appwrite.services.databases import Databases

from .config import get_config


class Store:
    """Minimal Appwrite store."""
    
    def __init__(self):
        config = get_config()
        
        self.client = Client()
        self.client.set_endpoint(config.APPWRITE_ENDPOINT)
        self.client.set_project(config.APPWRITE_PROJECT)
        self.client.set_key(config.APPWRITE_API_KEY)
        
        self.db = Databases(self.client)


@lru_cache(maxsize=1)
def get_store() -> Store:
    """Get the global store instance."""
    return Store()
