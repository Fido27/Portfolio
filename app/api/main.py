import json
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

df = pd.read_csv("app/api/nifty.csv")

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

@app.get("/")
def read_root():
    return {"Hello": "World"}


def start():
    started = "FastAPI is Success"
    print(started)

@app.get("/imf/")
def logic(date , amount):
    amount = int(amount)
    row_index = df.query('Date == "%s"' % date).index[0]
    cp = df.iloc[row_index]["NIFTY"]
    sp = df.iloc[7]["NIFTY"]
    return json.dumps(sp * amount - cp * amount)
