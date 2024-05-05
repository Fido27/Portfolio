from fastapi import APIRouter

api = APIRouter(
    prefix = "/linuxmancyclopedia",
)

@api.get("/")
async def mancyclopedia():
    return [{"username": "Rick"}, {"username": "Morty"}]

@api.get("/cat")
async def get_man_page_for(cmd):
    return {
        "name": "neko",
        "desc": "concats files and throws them at stdout",
        "synopsis": "idk what this means",
    }

# @api.get("/users/{username}", tags=["users"])
# async def read_user(username: str):
#     return {"username": username}