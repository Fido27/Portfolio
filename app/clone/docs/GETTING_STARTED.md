# 🚀 Getting Started with Your Fido AI

Quick 10-minute setup to get your AI assistant running!

---

## ✅ Prerequisites

- [x] Python 3.11+
- [x] Node.js 18+
- [x] Appwrite account (cloud.appwrite.io)
- [x] Gemini API key (aistudio.google.com/app/apikey)
- [x] n8n instance (optional for now)

---

## 📋 Setup Steps

### 1. Generate Your API Key (1 min)

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Copy the output** - this is your owner API key!

---

### 2. Create Environment File (2 min)

Create `.env` in your project root:

```bash
# Copy and customize
cat > app/api/clone/.env << 'EOF'
# Your secure owner key (paste from step 1)
OWNER_API_KEY=paste-your-key-here
OWNER_USERNAME=Your Name

# Appwrite (get from cloud.appwrite.io)
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_CLONE_PROJECT=your-project-id
APPWRITE_CLONE_API_KEY=your-api-key
APPWRITE_CLONE_DB_ID=fido
APPWRITE_CLONE_SESSIONS_COLL_ID=sessions
APPWRITE_CLONE_MESSAGES_COLL_ID=messages

# Gemini (get from aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash-exp

# n8n (can skip for now)
N8N_WEBHOOK_URL=https://placeholder.com
EOF
```

---

### 3. Set Up Appwrite (3 min)

Go to [cloud.appwrite.io](https://cloud.appwrite.io):

**Create Database:**
- Name: `fido`
- Copy the database ID → paste in `.env` as `APPWRITE_CLONE_DB_ID`

**Create Collection: `sessions`**

Add these attributes:
- `userId` (string, required, size: 255)
- `title` (string, default: "New chat", size: 500)
- `personaId` (string, default: "aarav", size: 100)
- `updatedAt` (integer, required)

**Create Collection: `messages`**

Add these attributes:
- `sessionId` (string, required, size: 255)
- `role` (string, required, size: 50)
- `content` (string, required, size: 50000)
- `ts` (integer, required)

**Copy collection IDs** → paste in `.env`

---

### 4. Install Dependencies (2 min)

**Backend:**
```bash
cd app/api/clone
pip install -r requirements.txt
# or if you don't have requirements.txt:
pip install fastapi uvicorn google-adk appwrite httpx pydantic
```

**Frontend:**
```bash
# In project root
npm install
```

---

### 5. Start Everything (1 min)

**Terminal 1 - Backend:**
```bash
cd app/api/clone
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 - Frontend:**
```bash
# In project root
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

---

### 6. Open the App (1 min)

1. Go to **http://localhost:3000/clone**
2. When prompted, enter your **owner API key** (from step 1)
3. You should see the chat interface!

---

## 🎉 Test It Out

Try these commands:

```
Hi! What can you do?
```

```
Tell me a joke
```

```
What's 25 * 67?
```

If you set up smart home tools:
```
Turn on the living room lights
```

---

## 🔧 Troubleshooting

### "Invalid API key"

**Problem:** Frontend can't authenticate

**Fix:**
1. Check `OWNER_API_KEY` in `app/api/clone/.env`
2. Make sure you're entering the **exact same key** in the browser
3. Restart backend: `Ctrl+C` then `uvicorn main:app --reload`

---

### "Module not found" errors

**Problem:** Missing Python dependencies

**Fix:**
```bash
cd app/api/clone
pip install fastapi uvicorn google-adk appwrite httpx pydantic
```

---

### Backend won't start - "Missing env var OWNER_API_KEY"

**Problem:** `.env` file not loaded or missing

**Fix:**
1. Make sure `.env` exists in `app/api/clone/.env`
2. Check file is not named `.env.txt` (Windows sometimes does this)
3. Try: `export $(cat app/api/clone/.env | xargs) && uvicorn main:app --reload`

---

### "Network error" when sending messages

**Problem:** Frontend can't reach backend

**Fix:**
1. Check backend is running (Terminal 1 should show logs)
2. Check URL is `http://localhost:8000` (not https)
3. Check browser console for errors (F12 → Console tab)

---

### Gemini errors - "API key invalid"

**Problem:** Bad Gemini API key

**Fix:**
1. Go to https://aistudio.google.com/app/apikey
2. Create new key or copy existing
3. Update `GEMINI_API_KEY` in `.env`
4. Restart backend

---

### Appwrite errors - "Collection not found"

**Problem:** Wrong collection IDs

**Fix:**
1. Go to Appwrite console
2. Click on your collections
3. Copy the IDs from the URL (after `/databases/...`)
4. Update `.env` with correct IDs
5. Restart backend

---

## 📚 Next Steps

### Add Your First Tool

Edit `app/api/clone/tools.py`:

```python
@_registry.register(
    name="hello_world",
    description="A simple test tool",
    owner_only=False,
)
async def hello_world(name: str) -> dict[str, Any]:
    """Say hello to someone."""
    return {
        "ok": True,
        "result": f"Hello, {name}! 👋"
    }
```

Restart backend, then ask:
```
Say hello to me using the hello_world tool
```

---

### Set Up n8n (Optional)

1. **Create n8n workflow:**
   - Trigger: Webhook (POST)
   - Receives: `{"command": "...", "type": "..."}`
   - Returns: `{"reply": "..."}`

2. **Copy webhook URL** → paste in `.env` as `N8N_WEBHOOK_URL`

3. **Test:**
   ```
   Control my smart home: turn on the lights
   ```

---

### Add More Tools

Check `TOOL_EXAMPLES.md` for ready-to-use code:
- Web search
- OBS control
- Calendar management
- File operations
- Camera/vision
- And more!

---

## 🎯 You're Ready!

Your foundation is solid:
- ✅ Secure API key auth
- ✅ Extensible tool system
- ✅ Clean, modular code
- ✅ Beautiful streaming UI
- ✅ Persistent chat history

**Now go build your Fido!** 🚀

See `TOOL_EXAMPLES.md` for inspiration.

