# 🤖 Fido AI - Complete Documentation

> Your personal AI assistant with extensible tools, clean architecture, and strong foundations.

---

## 📁 Project Structure

```
portfolio/
├── app/
│   ├── api/
│   │   ├── main.py                    # FastAPI entry point
│   │   └── clone/                     # Fido backend
│   │       ├── api.py                 # API routes (bootstrap, send, etc)
│   │       ├── auth.py                # 🆕 API key authentication
│   │       ├── tools.py               # 🆕 Tool registry system
│   │       ├── adk_agent.py           # Gemini ADK integration
│   │       ├── store.py               # Appwrite database wrapper
│   │       ├── persona.py             # System prompts for personas
│   │       ├── settings.py            # Environment config
│   │       ├── schemas.py             # Pydantic models
│   │       ├── util.py                # Helper functions
│   │       └── requirements.txt       # Python dependencies
│   │
│   └── clone/                         # Fido frontend
│       ├── page.tsx                   # Main page component
│       ├── useCloneChat.ts            # 🆕 Simplified main hook (50 lines!)
│       ├── useAuth.ts                 # 🆕 API key management
│       ├── useSessions.ts             # 🆕 Session CRUD
│       ├── useChat.ts                 # 🆕 Messaging logic
│       ├── replyClient.ts             # SSE streaming client
│       ├── personas.ts                # Type definitions
│       ├── ids.ts                     # ID generation
│       ├── Markdown.tsx               # Markdown renderer
│       └── components/
│           ├── ChatFeed.tsx           # Message display
│           ├── Composer.tsx           # Input box
│           ├── Sidebar.tsx            # Session list & personas
│           └── RightBanner.tsx        # Branding
│
├── GETTING_STARTED.md                 # 🆕 Quick setup guide
├── CHANGES_SUMMARY.md                 # 🆕 What changed in refactor
├── TOOL_EXAMPLES.md                   # 🆕 Ready-to-use tool code
├── FIDO_SETUP.md                      # 🆕 Detailed setup instructions
└── README_FIDO.md                     # 🆕 This file
```

---

## 🎯 What Is This?

A **personal AI assistant** (named Fido!) that can:

✅ **Chat naturally** using Gemini 2.0 Flash  
✅ **Use tools** to control your world (smart home, OBS, calendar, etc)  
✅ **Remember context** across multiple chat sessions  
✅ **Stream responses** with beautiful typing animations  
✅ **Switch personas** (friendly, tutor, random)  
✅ **Manage permissions** (owner vs guest access)  

---

## 🚀 Quick Start

**5 minutes to running:**

1. **Generate API key:**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Create `.env` in `app/api/` (not in `app/api/clone/`):**
   ```env
   OWNER_API_KEY=your-generated-key
   OWNER_USERNAME=Your Name
   
   # Get these from cloud.appwrite.io
   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   APPWRITE_CLONE_PROJECT=...
   APPWRITE_CLONE_API_KEY=...
   APPWRITE_CLONE_DB_ID=fido
   APPWRITE_CLONE_SESSIONS_COLL_ID=sessions
   APPWRITE_CLONE_MESSAGES_COLL_ID=messages
   
   # Get from aistudio.google.com/app/apikey
   GEMINI_API_KEY=your-gemini-key
   
   # Can skip for now
   N8N_WEBHOOK_URL=https://placeholder.com
   ```

3. **Install & Run:**
   ```bash
   # Backend
   cd app/api/clone
   pip install -r requirements.txt
   cd ..
   uvicorn main:app --reload
   
   # Frontend (new terminal)
   npm run dev
   ```

4. **Open http://localhost:3000/clone**
5. **Enter your API key when prompted**
6. **Start chatting!**

📖 **Full setup:** See `GETTING_STARTED.md`

---

## 🛠️ Architecture Highlights

### Authentication (Simple & Secure)

- **API key based** (not username/password)
- **Two roles:** Owner (full access) + Guest (limited)
- **Standard HTTP:** `Authorization: Bearer <key>` header
- **No database lookups** for auth (fast!)

```python
# Backend automatically validates on every request
@api.post("/session/{session_id}/send")
async def send_message(
    session_id: str,
    req: SendMessageRequest,
    user: User = Depends(get_current_user),  # ← Auto-auth!
):
    # user.is_owner() tells you if they have full access
    ...
```

### Tool System (Extensible & Clean)

Add tools in **2 ways:**

**Option 1: Python function**
```python
@_registry.register(
    name="web_search",
    description="Search the web",
    owner_only=False,
)
async def web_search(query: str) -> dict:
    # Your code here
    return {"ok": True, "results": [...]}
```

**Option 2: n8n webhook**
```python
_registry.register_n8n_webhook(
    name="obs_control",
    webhook_url="https://n8n.app/webhook/obs",
    description="Control OBS scenes",
    owner_only=True,
)
```

The AI **automatically** gets access to all registered tools!

### Frontend (Modular & Simple)

**Before:** 1 hook with 331 lines  
**After:** 3 focused hooks totaling ~200 lines

```typescript
useAuth()      // API key, login/logout
useSessions()  // CRUD for sessions  
useChat()      // Messaging, streaming
```

**Benefits:**
- Easy to understand
- Easy to debug  
- Easy to test
- Easy to extend

---

## 🎨 Features

### Multi-Session Chat
- Create unlimited chat sessions
- Each session has its own history
- Switch between sessions instantly
- Auto-titles sessions from first message

### Personas
- **Fido** - Friendly, helpful, loyal
- **Tutor Quiglim** - Explains with steps and examples
- **Random** - Picks a tone for each reply

### Streaming Responses
- Real-time SSE streaming
- Smooth typing animation
- Cursor indicator while generating
- Cancel-safe error handling

### Markdown Support
- Code blocks with syntax highlighting
- Lists, tables, blockquotes
- Links, images
- GitHub-flavored markdown (GFM)

### Tool Execution
- AI decides when to use tools
- Tools execute server-side
- Results integrated into responses
- Permission-based access

---

## 🔐 Security Model

### Owner Access (You)
- Full access to ALL tools
- Can control smart home
- Can send notifications
- Can manage files
- Can use camera/vision

### Guest Access (Family/Friends)
- Limited to "safe" tools only
- Can use web search
- Can ask general questions
- Cannot control devices
- Cannot access private data

**Control per-tool:**
```python
@_registry.register(
    owner_only=True,  # ← Only owner can use
)
async def control_lights(...):
    ...
```

---

## 📊 Data Flow

### Chat Message Flow

```
User types message
    ↓
useChat.sendMessage()
    ↓
API: /clone/session/{id}/send (with Bearer token)
    ↓
Validate user owns session
    ↓
Load message history from Appwrite
    ↓
Build ADK agent with tools
    ↓
Stream response via SSE
    ↓
Frontend updates UI in real-time
    ↓
Save message to Appwrite
```

### Tool Execution Flow

```
AI decides tool is needed
    ↓
ADK calls tool function
    ↓
Tool checks user.can_use_tool(tool_name)
    ↓
If Python: Execute directly
If n8n: POST to webhook
    ↓
Return result to AI
    ↓
AI incorporates result into response
    ↓
User sees natural language explanation
```

---

## 🧩 Tech Stack

### Backend
- **FastAPI** - API framework
- **Google ADK** - AI agent framework
- **Gemini 2.0 Flash** - LLM
- **Appwrite** - Database (sessions + messages)
- **Pydantic** - Data validation
- **httpx** - HTTP client for webhooks

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **react-markdown** - Message rendering
- **SSE** - Server-Sent Events for streaming

### Infrastructure
- **n8n** - Workflow automation (optional)
- **Qdrant** - Vector DB for memory (optional)
- **OBS WebSocket** - Streaming control (optional)

---

## 🎯 Tool Ideas

See `TOOL_EXAMPLES.md` for full implementations of:

1. **OBS Scene Control** - Change streaming scenes
2. **Twitch Chat Analysis** - Summarize chat activity
3. **Smart Home** - Lights, locks, temperature
4. **Notifications** - Push, SMS, email
5. **Web Search** - Google, Tavily
6. **Calendar** - View/add events
7. **Shopping List** - Walmart cart integration
8. **Camera/Vision** - Analyze webcam feed
9. **File Operations** - Read/write files safely
10. **Memory** - Remember facts about you

---

## 🐛 Common Issues

### "Invalid API key"
- Check `.env` is in `app/api/` (NOT `app/api/clone/`)
- Use `load_dotenv()` in `main.py` (✅ already there)
- Restart backend after changing `.env`

### Tools not working
- Check tool is registered in `tools.py`
- Check `owner_only` setting
- Check n8n webhook responds with `{"reply": "..."}`

### Streaming stuck
- Check Gemini API key is valid
- Check you have API credits
- Check browser console for errors (F12)

### Appwrite errors
- Verify collection IDs are correct
- Check attributes match schema
- Ensure API key has proper permissions

---

## 📝 Environment Variables

**Required:**
```env
OWNER_API_KEY=...              # Your secure owner key
GEMINI_API_KEY=...             # Gemini API key
APPWRITE_CLONE_PROJECT=...     # Appwrite project ID
APPWRITE_CLONE_API_KEY=...     # Appwrite API key
APPWRITE_CLONE_DB_ID=...       # Database ID
APPWRITE_CLONE_SESSIONS_COLL_ID=...
APPWRITE_CLONE_MESSAGES_COLL_ID=...
```

**Optional:**
```env
OWNER_USERNAME=Your Name       # Display name
GUEST_API_KEY=...              # For guests
GEMINI_MODEL=gemini-2.0-flash-exp  # Model choice
N8N_WEBHOOK_URL=...            # For tool execution
```

**Note:** The `.env` file should be in `app/api/` because that's where `main.py` calls `load_dotenv()`.

---

## 🚧 Roadmap

### ✅ Completed (Foundation)
- [x] API key authentication
- [x] Tool registry system
- [x] Split frontend hooks
- [x] Simplified streaming
- [x] Clean architecture

### 🎯 Next Up
- [ ] Add 3-5 core tools (web search, calendar, etc)
- [ ] Tool approval UI (confirm before execution)
- [ ] Long-term memory with Qdrant
- [ ] Voice input (speech-to-text)
- [ ] Voice output (text-to-speech)

### 🔮 Future
- [ ] Multi-modal (images, files in chat)
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Custom wake word ("Hey Fido")
- [ ] Analytics dashboard
- [ ] Tool marketplace/plugins

---

## 🤝 Contributing (for yourself!)

### Adding a New Tool

1. **Edit `app/api/clone/tools.py`**
2. **Add your function with `@_registry.register(...)`**
3. **Restart backend**
4. **Test:** Ask AI to use it!

### Adding a New Persona

1. **Edit `app/api/clone/persona.py`**
2. **Add case in `system_prompt_for_persona()`**
3. **Edit `app/clone/personas.ts`**
4. **Add to `PERSONAS` array**

### Debugging Tips

- **Backend logs:** Watch terminal running `uvicorn`
- **Frontend logs:** Browser console (F12)
- **Network:** Check DevTools Network tab for API calls
- **Database:** Appwrite console shows all data
- **SSE:** Look for `text/event-stream` requests

---

## 📚 Documentation Files

- **`README_FIDO.md`** (this file) - Overview & architecture
- **`GETTING_STARTED.md`** - Quick setup (10 min)
- **`FIDO_SETUP.md`** - Detailed setup & tips
- **`CHANGES_SUMMARY.md`** - What changed in refactor
- **`TOOL_EXAMPLES.md`** - Ready-to-use tool code

---

## 💡 Philosophy

This project prioritizes:

1. **Simplicity** - Clean code over clever code
2. **Extensibility** - Easy to add tools/features
3. **Strong foundations** - Proper auth, types, architecture
4. **Personal use** - Optimized for 1-5 users, not scale
5. **Learning** - Code should teach, not confuse

**Result:** A codebase you can understand, modify, and grow with confidence.

---

## 🙏 Credits

- **Google ADK** - Agent framework
- **Gemini** - LLM brain
- **Appwrite** - Database
- **FastAPI** - Web framework
- **Next.js** - Frontend
- **You!** - For building something awesome

---

## 📄 License

MIT (or whatever you want - it's your personal project!)

---

## 🎉 Final Words

You now have **strong, simple foundations** for your Fido AI.

- ✅ Auth system that's secure and simple
- ✅ Tool framework that's extensible and clean  
- ✅ Frontend that's modular and beautiful
- ✅ Architecture that's easy to understand

**Go build your dream AI assistant!** 🚀

Questions? Check the docs. Still stuck? Read the code - it's simple now!

Happy hacking! 🐕

