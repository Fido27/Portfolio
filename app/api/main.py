import json
import random
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# from app.api.linuxmancyclopedia import api as mancyclopedia

df = pd.read_csv("app/api/nifty.csv")

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

# app.include_router(mancyclopedia)
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

@app.get("/imf/")
def logic(amount):
    amount = int(amount)
    row_index = random.randrange(1, len(df) - 248)
    cp = df.iloc[row_index]["NIFTY"]
    sp = df.iloc[row_index + 248]["NIFTY"]

    gains = amount * (sp/cp)
    gains_percent = ((gains - amount) / amount) * 100

    return json.dumps({
        "date" : df.iloc[row_index]["Date"],
        "gains" : gains,
        "gains_percent" : gains_percent,
    })