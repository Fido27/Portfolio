import json
import random
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from app.api.linuxmancyclopedia.linuxmancyclopedia import api as mancyclopedia
from app.api.clone.api import api as clone
from app.api.clone.orchestrator import get_orchestrator
from app.api.worldclock.worldclock import api as worldclock
# from app.api.worldclock.admin.admin import api as admin

async def startup():
    """Initialize Fido systems on startup"""
    print("🚀 Starting Fido AI systems...")
    
    # Start orchestrator (required for task management)
    orchestrator = get_orchestrator()
    await orchestrator.start()
    print("  ✅ Orchestrator started")
    
    # Start scheduler (required for time-based tasks)
    from app.api.clone.scheduler import get_scheduler
    scheduler = get_scheduler()
    await scheduler.start()
    print("  ✅ Scheduler started")
    
    # Start agent loop (autonomous behavior)
    # agent_loop = get_agent_loop()
    # await agent_loop.start(AgentMode.ASSISTANT)
    # print("  ✅ Agent loop started (ASSISTANT mode)")
    
    print("🎉 Fido is now alive and ready!")

async def shutdown():
    """Clean shutdown of Fido systems"""
    print("🛑 Shutting down Fido AI systems...")
    
    # Agent loop removed - using ADK Runner now
    # agent_loop = get_agent_loop()
    # await agent_loop.stop()
    # print("  ✅ Agent loop stopped")
    
    from app.api.clone.scheduler import get_scheduler
    scheduler = get_scheduler()
    scheduler.stop()
    print("  ✅ Scheduler stopped")
    
    orchestrator = get_orchestrator()
    await orchestrator.stop()
    print("  ✅ Orchestrator stopped")
    
    print("👋 Fido shutdown complete")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup()
    yield
    await shutdown()

load_dotenv()
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mancyclopedia)
app.include_router(clone)
app.include_router(worldclock)
# app.include_router(admin)
# app.include_router(items.router)
# app.include_router(
#     admin.router,
#     prefix="/admin",
#     tags=["admin"],
#     dependencies=[Depends(get_token_header)],
#     responses={418: {"description": "I'm a teapot"}},
# )

@app.get("/")
def root():
    return {"Hello": "World"}