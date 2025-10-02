import json
import random
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from app.api.linuxmancyclopedia import api as mancyclopedia
from app.api.clone import api as clone
from app.api.worldclock.worldclock import api as worldclock
from app.api.worldclock.admin.admin import api as admin

def start():
    started = "FastAPI is Success"
    print(started)

@asynccontextmanager
async def lifespan(app: FastAPI):
    start()
    yield

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
app.include_router(admin)
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