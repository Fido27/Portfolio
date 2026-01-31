from __future__ import annotations

import os
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

def get_env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing env var {name}")
    return v

class CloneSettings:
    # Auth - API Keys
    OWNER_API_KEY: str
    OWNER_USERNAME: str
    GUEST_API_KEY: str
    # Add more API keys as needed:
    # FAMILY_API_KEY: str
    # WORK_API_KEY: str

    # Appwrite
    APPWRITE_ENDPOINT: str
    APPWRITE_PROJECT: str
    APPWRITE_API_KEY: str
    APPWRITE_DB_ID: str
    APPWRITE_SESSIONS_COLL_ID: str
    APPWRITE_MESSAGES_COLL_ID: str

    # ADK / Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str
    ORCHESTRATOR_MODEL: str
    CRITIC_MODEL: str
    WORKER_MODEL: str
    MAX_SEARCH_ITERATIONS: int

    # n8n
    N8N_WEBHOOK_URL: str

    #HASS
    HASS_URL: str
    HASS_TOKEN: str
    HASS_HEADERS: dict[str, str]
    
    #Qdrant (Memory/RAG)
    QDRANT_URL: str
    QDRANT_API_KEY: str | None
    
    # Scheduler
    APPWRITE_SCHEDULED_TASKS_COLL_ID: str

    def __init__(self) -> None:
        # Auth keys
        self.OWNER_API_KEY = get_env("OWNER_API_KEY")
        self.OWNER_USERNAME = get_env("OWNER_USERNAME") or "Owner"
        
        # Optional: Add more API keys
        # self.GUEST_API_KEY = get_env("GUEST_API_KEY") or "guest-key-change-me"
        # self.FAMILY_API_KEY = os.getenv("FAMILY_API_KEY") or ""
        # self.WORK_API_KEY = os.getenv("WORK_API_KEY") or ""

        # Appwrite (removed USERS collection - don't need it anymore)
        self.APPWRITE_ENDPOINT = get_env("APPWRITE_ENDPOINT")
        self.APPWRITE_PROJECT = get_env("APPWRITE_CLONE_PROJECT")
        self.APPWRITE_API_KEY = get_env("APPWRITE_CLONE_API_KEY")
        self.APPWRITE_DB_ID = get_env("APPWRITE_CLONE_DB_ID")
        self.APPWRITE_SESSIONS_COLL_ID = get_env("APPWRITE_CLONE_SESSIONS_COLL_ID")
        self.APPWRITE_MESSAGES_COLL_ID = get_env("APPWRITE_CLONE_MESSAGES_COLL_ID")
        self.APPWRITE_SCHEDULED_TASKS_COLL_ID = get_env("APPWRITE_CLONE_SCHEDULED_TASKS_COLL_ID") or "scheduled_tasks"

        # Gemini AI
        self.GEMINI_API_KEY = get_env("GEMINI_API_KEY")
        self.GEMINI_MODEL = "gemini-3.0-pro-preview"
        self.orchestrator_model = "gemini-3-pro-preview"
        self.critic_model = "gemini-3-pro-preview"
        self.worker_model = "gemini-3-pro-preview"
        self.max_search_iterations = 5
        
        self.N8N_WEBHOOK_URL = get_env("N8N_WEBHOOK_URL")

        # HASS
        self.HASS_URL = get_env("HASS_URL")
        self.HASS_TOKEN = get_env("HASS_TOKEN")
        self.HASS_HEADERS = {
            "Authorization": f"Bearer {self.HASS_TOKEN}",
            "Content-Type": "application/json",
        }
        
        # Qdrant (Memory/RAG)
        self.QDRANT_URL = get_env("QDRANT_URL") or "http://localhost:6333"
        self.QDRANT_API_KEY = get_env("QDRANT_API_KEY")

@lru_cache(maxsize=1)
def get_config() -> CloneSettings:
    # Lazy-load env vars so imports don't crash tooling/tests.
    return CloneSettings()