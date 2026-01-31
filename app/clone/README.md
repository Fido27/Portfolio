# 🤖 Fido AI

Your personal AI assistant with extensible tools and clean architecture.

## 📚 Documentation

**📖 [Complete Documentation Index](./docs/INDEX.md)**

**🚀 Quick Links:**
- **[MASTER PLAN](./docs/MASTER_PLAN.md)** ⭐ - Complete roadmap for full JARVIS system
- [Getting Started (10 min)](./docs/GETTING_STARTED.md) - Set up Fido
- [Quick Reference](./docs/QUICK_REFERENCE.md) - Key concepts explained
- [Phase 1: Memory](./docs/PHASE_1_MEMORY.md) - Add RAG (start here!)
- [Tool Examples](./docs/TOOL_EXAMPLES.md) - Copy-paste tool code
- [API Keys Guide](./docs/API_KEYS_GUIDE.md) - Multiple users/permissions

## 🚀 Quick Start

```bash
# 1. Generate API key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 2. Create .env in project root
cp app/clone/docs/.env.fido.example .env
# Edit .env with your values (OWNER_API_KEY, GEMINI_API_KEY, etc.)

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run backend
cd app/api
uvicorn main:app --reload

# 5. Run frontend (new terminal)
npm run dev

# 6. Open http://localhost:3000/clone
```

## 🎯 What Is This?

A personal AI assistant that can:
- Chat naturally with streaming responses
- Use tools (smart home, notifications, custom tools)
- Remember context across sessions
- Switch personalities
- Control access (owner vs guests)

## 📁 Project Structure

```
app/clone/
├── docs/              # All documentation
├── components/        # UI components
├── page.tsx          # Main page
├── useAuth.ts        # API key auth
├── useSessions.ts    # Session management
├── useChat.ts        # Messaging & streaming
├── useCloneChat.ts   # Main hook (combines above)
└── personas.ts       # Personality definitions
```

## 🔧 Backend

Located in `app/api/clone/`:
- `api.py` - API routes
- `auth.py` - API key authentication
- `tools.py` - Tool registry
- `adk_agent.py` - Gemini AI integration
- `store.py` - Appwrite database
- `persona.py` - System prompts

## 🛠️ Adding Tools

See [`docs/TOOL_EXAMPLES.md`](./docs/TOOL_EXAMPLES.md) for ready-to-use tool code.

Quick example:

```python
# In app/api/clone/tools.py
@_registry.register(name="my_tool", description="What it does")
async def my_tool(param: str) -> dict:
    return {"ok": True, "result": "..."}
```

Restart backend, and Fido can use it!

## 🔑 Multiple API Keys

Want to give family/friends access with limited tools?

See [`docs/API_KEYS_GUIDE.md`](./docs/API_KEYS_GUIDE.md)

Quick example:

```python
# In app/api/clone/auth.py
if api_key == s.FAMILY_API_KEY:
    return User(
        user_id="family",
        username="Family",
        allowed_tools={"smart_home_control", "web_search"}
    )
```

## 📖 Full Documentation

Everything is in [`docs/`](./docs/) folder:
- Setup guides
- Tool examples  
- API keys management
- Architecture diagrams
- Troubleshooting

**Start with:** [`docs/START_HERE.md`](./docs/START_HERE.md)

## 🎉 Ready to Build!

Your Fido AI is ready to go. Add tools, customize, and build your perfect assistant! 🐕

