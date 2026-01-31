# 🤖 Fido AI Setup Guide

Your AI assistant has been **massively simplified** while keeping everything you need for a solid foundation.

## What Changed

### ✅ Improvements

1. **Simple API Key Auth** - Owner vs Guest roles (no complex username system)
2. **Clean Tool Registry** - Easy to add new tools (Python functions or n8n webhooks)
3. **Split Frontend Hooks** - 3 small hooks instead of 1 giant 331-line hook
4. **Simplified Streaming** - Removed complex token queue, just direct updates
5. **Removed Complexity** - No more username DB, simpler state management

### 📦 What You Need

- **Appwrite**: 2 collections (sessions, messages) - NO users collection needed
- **Gemini API**: For the AI brain
- **n8n**: For tool execution (smart home, notifications, etc)
- **API Keys**: Owner key (you) and optional guest key

---

## Quick Start

### 1. Set Up Environment

Copy the example env file:

```bash
cp app/api/clone/.env.example app/api/clone/.env
```

Generate a secure owner API key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add it to `.env`:

```env
OWNER_API_KEY=your-generated-key-here
OWNER_USERNAME=Your Name
```

### 2. Configure Appwrite

Go to your Appwrite console and create:

**Database**: `fido`

**Collection: `sessions`**
- `userId` (string, required)
- `title` (string, default: "New chat")
- `personaId` (string, default: "fido")
- `updatedAt` (integer, required)

**Collection: `messages`**
- `sessionId` (string, required)
- `role` (string, required) - "user" or "assistant"
- `content` (string, required)
- `ts` (integer, required)

Add collection IDs to `.env`:

```env
APPWRITE_CLONE_DB_ID=fido
APPWRITE_CLONE_SESSIONS_COLL_ID=<sessions-collection-id>
APPWRITE_CLONE_MESSAGES_COLL_ID=<messages-collection-id>
```

### 3. Get Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Add to `.env`:

```env
GEMINI_API_KEY=your-gemini-key
```

### 4. Set Up n8n Webhook (Optional for now)

Create a webhook in n8n that accepts:

```json
{
  "command": "user's request",
  "type": "smart_home" | "notification" | etc
}
```

And returns:

```json
{
  "reply": "Success message"
}
```

Add webhook URL to `.env`:

```env
N8N_WEBHOOK_URL=https://your-n8n.app/webhook/fido
```

---

## Running the App

### Backend (FastAPI)

```bash
cd app/api/clone
uvicorn main:app --reload
```

### Frontend (Next.js)

```bash
npm run dev
```

Visit `http://localhost:3000/clone` and enter your owner API key when prompted.

---

## Adding New Tools

### Method 1: Python Function

Edit `app/api/clone/tools.py`:

```python
@_registry.register(
    name="web_search",
    description="Search the web for current information",
    owner_only=False,  # Guests can use this
)
async def web_search(query: str) -> dict[str, Any]:
    """Search the web and return results."""
    # Your search logic here (Google Custom Search, Tavily, etc.)
    return {"ok": True, "results": "..."}
```

### Method 2: n8n Webhook

```python
_registry.register_n8n_webhook(
    name="change_obs_scene",
    webhook_url="https://your-n8n.app/webhook/obs",
    description="Change OBS streaming scene",
    owner_only=True,
)
```

**That's it!** The tool is automatically available to the AI.

---

## Project Structure

```
app/clone/                    # Frontend
├── page.tsx                 # Main page
├── useCloneChat.ts          # Main hook (now just 50 lines!)
├── useAuth.ts               # API key management
├── useSessions.ts           # Session CRUD
├── useChat.ts               # Messaging logic
├── replyClient.ts           # SSE streaming
└── components/              # UI components

app/api/clone/               # Backend
├── api.py                   # FastAPI routes
├── auth.py                  # 🆕 API key auth
├── tools.py                 # 🆕 Tool registry
├── adk_agent.py             # Gemini ADK integration
├── store.py                 # Appwrite wrapper
├── persona.py               # System prompts
└── settings.py              # Config
```

---

## What's Next

### Immediate (Foundation Complete ✅)
- [x] API key auth
- [x] Tool registry
- [x] Simplified frontend
- [x] Clean streaming

### Soon (Add Tools)
- [ ] Web search tool
- [ ] OBS scene control
- [ ] File operations
- [ ] Calendar integration
- [ ] Voice input/output

### Later (Advanced Features)
- [ ] Long-term memory (Qdrant)
- [ ] Multi-modal (images, voice)
- [ ] Tool approval UI
- [ ] Analytics/usage tracking

---

## Example Tools for Your Fido

Based on your vision:

```python
# Smart Home
@_registry.register(name="smart_home", ...)
async def smart_home_control(command: str): ...

# OBS Control
@_registry.register(name="obs_scene", ...)
async def change_obs_scene(scene: str): ...

# Twitch Integration
@_registry.register(name="twitch_chat", ...)
async def analyze_twitch_chat(hours: int = 1): ...

# Notifications
@_registry.register(name="notify", ...)
async def send_notification(message: str): ...

# Calendar
@_registry.register(name="calendar", ...)
async def manage_calendar(action: str, details: dict): ...

# Shopping
@_registry.register(name="shopping", ...)
async def add_to_cart(items: list[str]): ...

# Web Search
@_registry.register(name="search", ...)
async def web_search(query: str): ...
```

---

## Tips

1. **Keep tools simple** - One tool = one clear purpose
2. **Use n8n for complex workflows** - Let n8n handle API integrations
3. **Test with guest key** - Make sure permission system works
4. **Add logging** - Use `print()` for now, add proper logging later
5. **Start small** - Get 2-3 tools working well before adding more

---

## Troubleshooting

**"Invalid API key" on login**
- Check `OWNER_API_KEY` in backend `.env`
- Make sure frontend is using the same key

**"Unknown user" error**
- This is from the old system - shouldn't happen with new auth
- Check that you're using `/clone/bootstrap` not `/clone/login`

**Tools not working**
- Check tool is registered in `tools.py`
- Check user role (owner vs guest)
- Check n8n webhook is responding

**Streaming stuck on "Thinking..."**
- Check Gemini API key
- Check network tab for SSE errors
- Verify ADK is streaming properly

---

## Need Help?

The code is now **way simpler**:
- `useCloneChat.ts`: 50 lines (was 331)
- `auth.py`: Clear role-based access
- `tools.py`: Self-documenting registry

Read the code - it should be obvious now! 🎉

