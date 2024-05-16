from fastapi import APIRouter
import ollama

api = APIRouter(
    prefix = "/linuxmancyclopedia",
)

@api.get("/")
async def mancyclopedia():
    return [{"username": "Rick"}, {"username": "Morty"}]

@api.get("/llama/{cmd}/{flags}")
async def llama_calls(cmd , flags):
    prompt = "Explain what the following linux command does in 100 words or less: " + cmd + " -" + flags
    messages = ollama.chat(model='llama3', messages=[
    {
        'role': 'user',
        'content': prompt,
    },
    ])
    res = messages['message']['content']
    print(prompt)
    return res

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