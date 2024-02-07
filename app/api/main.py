from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
import pandas as pd

@asynccontextmanager
async def lifespan(app: FastAPI):
    start()
    # yield
    # ml_models.clear()

load_dotenv()
app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000"
    "https://fido27.tech"
]

@app.get("/")
def read_root():
    return {"Hello": "World"}


def start():
    started = "FastAPI is Success"
    print(started)
    df = initdf()
    profit = logic(df , "IMF" , 3)
    print("If you bought this stock on monday, by friday you would have " + str(profit))
    return "FastAPI is Success"

def logic(df, stock , amount):
    row_index = df.query("Date == 'Monday'").index[0]
    cp = df.iloc[row_index][stock]
    row_index = df.query("Date == 'Friday'").index[0]
    sp = df.iloc[row_index][stock]
    print(row_index)
    print(cp)
    return sp * amount - cp * amount

def initdf():
    df2 = pd.DataFrame(columns=
        [
            "Date",
            "AAPL",
            "GOOG",
            "IMF",
        ]
    )

    df2.loc[len(df2)] = ["Monday" , 500 , 500 , 500]
    df2.loc[len(df2)] = ["Tuesday" , 400 , 400 , 400]
    df2.loc[len(df2)] = ["Wednesday" , 300 , 300 , 300]
    df2.loc[len(df2)] = ["Thursday" , 200 , 200 , 200]
    df2.loc[len(df2)] = ["Friday" , 100 , 100 , 100]
    return df2