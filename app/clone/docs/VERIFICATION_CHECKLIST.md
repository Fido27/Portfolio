# ✅ Verification Checklist

Use this to make sure everything works after the refactor!

---

## 🔧 Pre-Flight Checks

### Environment Setup

- [ ] **Generated owner API key** (`python3 -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] **Created `.env` in project root**
- [ ] **Added `OWNER_API_KEY` to `.env`**
- [ ] **Added `GEMINI_API_KEY` to `.env`**
- [ ] **Added all Appwrite vars to `.env`**
- [ ] **Placeholder `N8N_WEBHOOK_URL` in `.env`** (can be fake for now)

### Appwrite Setup

- [ ] **Created database** (name: `fido`)
- [ ] **Created `sessions` collection** with attributes:
  - [ ] `userId` (string, required)
  - [ ] `title` (string, default: "New chat")
  - [ ] `personaId` (string, default: "fido")
  - [ ] `updatedAt` (integer, required)
- [ ] **Created `messages` collection** with attributes:
  - [ ] `sessionId` (string, required)
  - [ ] `role` (string, required)
  - [ ] `content` (string, required)
  - [ ] `ts` (integer, required)
- [ ] **Copied collection IDs to `.env`**
- [ ] **(Optional) Deleted old `users` collection**

### Dependencies

- [ ] **Installed Python deps** (`pip install -r app/api/clone/requirements.txt`)
- [ ] **Installed Node deps** (`npm install`)

---

## 🚀 Start & Basic Tests

### Backend Starts

- [ ] **Backend runs without errors**
  ```bash
  cd app/api
  uvicorn main:app --reload
  ```
  Should see: `Uvicorn running on http://127.0.0.1:8000`

- [ ] **No import errors**
- [ ] **No env var errors**
- [ ] **FastAPI docs accessible** at http://localhost:8000/docs

### Frontend Starts

- [ ] **Frontend runs without errors**
  ```bash
  npm run dev
  ```
  Should see: `ready - started server on 0.0.0.0:3000`

- [ ] **No TypeScript errors**
- [ ] **No module resolution errors**

### Basic Connection

- [ ] **Can open http://localhost:3000/clone**
- [ ] **Prompted for API key**
- [ ] **API key validates** (shows username, not "Invalid API key")
- [ ] **Chat interface loads**

---

## 💬 Chat Functionality

### Create Session

- [ ] **Can create new session** (click "New" button)
- [ ] **New session appears in sidebar**
- [ ] **Session auto-selected**

### Send Message

- [ ] **Can type in composer**
- [ ] **Can send message** (click Send or Cmd/Ctrl+Enter)
- [ ] **User message appears in chat**
- [ ] **Streaming indicator shows** ("Thinking..." or cursor animation)
- [ ] **Assistant response streams in real-time**
- [ ] **Final response persists**

### Personas

- [ ] **Can switch persona** (click persona in sidebar)
- [ ] **Persona change persists** (refresh page, still selected)
- [ ] **AI responds with different tone** per persona

### Session Management

- [ ] **Can switch between sessions** (click different session)
- [ ] **Messages load correctly**
- [ ] **Can delete session** (click "Delete current")
- [ ] **Deleted session removed from sidebar**

---

## 🔐 Auth Tests

### Owner Access

- [ ] **Using owner key shows correct username**
- [ ] **Can use all tools**
- [ ] **Can create/delete sessions**

### Guest Access (Optional)

- [ ] **Generate guest key** (add to `.env` as `GUEST_API_KEY`)
- [ ] **Can login with guest key**
- [ ] **Cannot use owner-only tools**
- [ ] **Can use safe tools only**

### Invalid Key

- [ ] **Invalid key shows error**
- [ ] **Re-prompts for correct key**
- [ ] **No crashes**

---

## 🛠️ Tool Tests

### Built-in Tools

- [ ] **Smart home tool registered** (check backend logs on startup)
- [ ] **Notification tool registered**
- [ ] **Tool functions don't crash on import**

### Tool Execution (If n8n configured)

- [ ] **Ask: "Turn on the lights"**
- [ ] **AI calls tool** (check backend logs)
- [ ] **Tool response integrated** into answer
- [ ] **No errors in console**

### Tool Execution (n8n not configured)

- [ ] **Tool call fails gracefully**
- [ ] **AI explains error** to user
- [ ] **App doesn't crash**

---

## 🧪 Advanced Tests

### Error Handling

- [ ] **Backend crashes** → Frontend shows error
- [ ] **Invalid session ID** → 403 error
- [ ] **Empty message** → Not sent
- [ ] **Network error** → Graceful error message

### Persistence

- [ ] **Refresh page** → Sessions still loaded
- [ ] **Refresh page** → Messages still visible
- [ ] **Close tab, reopen** → Auto-login with saved key
- [ ] **Clear localStorage** → Re-prompts for key

### Streaming Edge Cases

- [ ] **Send message while streaming** → Disabled (button grayed out)
- [ ] **Switch session while streaming** → Streaming continues correctly
- [ ] **Long response** → Doesn't lag or freeze

### UI/UX

- [ ] **Markdown renders correctly** (code blocks, lists, links)
- [ ] **Long messages wrap properly**
- [ ] **Auto-scrolls to bottom** on new message
- [ ] **Composer auto-resizes** as you type
- [ ] **Mobile responsive** (if applicable)

---

## 🔍 Code Quality

### No Linter Errors

- [ ] **Run linter on backend**
  ```bash
  cd app/api/clone
  ruff check .  # or your linter
  ```

- [ ] **Run linter on frontend**
  ```bash
  npm run lint
  ```

### Type Checking

- [ ] **TypeScript compiles** (`npm run build`)
- [ ] **No type errors** in IDE

### Imports

- [ ] **All imports resolve**
- [ ] **No circular dependencies**
- [ ] **No unused imports**

---

## 📊 Performance

### Response Time

- [ ] **First message** < 3s to start streaming
- [ ] **Subsequent messages** < 1s to start streaming
- [ ] **Session load** < 1s
- [ ] **Session switch** instant

### Resource Usage

- [ ] **Backend uses** < 200MB RAM idle
- [ ] **Frontend loads** < 5s on localhost
- [ ] **No memory leaks** (check after 10+ messages)

---

## 🎨 Optional Enhancements

### Add First Custom Tool

- [ ] **Copy example from `TOOL_EXAMPLES.md`**
- [ ] **Paste into `app/api/clone/tools.py`**
- [ ] **Restart backend**
- [ ] **Tool appears in logs**
- [ ] **AI can use tool**

### Configure n8n

- [ ] **Create webhook workflow**
- [ ] **Test with curl/Postman**
- [ ] **Update `N8N_WEBHOOK_URL` in `.env`**
- [ ] **Restart backend**
- [ ] **Tools now execute via n8n**

---

## 🐛 Known Issues to Check

### Environment Variables

- [ ] **`.env` in correct location** (project root)
- [ ] **No quotes around values** (unless value has spaces)
- [ ] **No trailing spaces**
- [ ] **File is named `.env` not `.env.txt`**

### Appwrite

- [ ] **Collection IDs match exactly**
- [ ] **Attribute types match exactly**
- [ ] **API key has permissions** (databases.read, databases.write)
- [ ] **Endpoint URL correct** (https://cloud.appwrite.io/v1)

### Gemini

- [ ] **API key valid**
- [ ] **Account has credits**
- [ ] **Using supported model** (gemini-2.0-flash-exp or gemini-2.5-flash)

---

## ✅ Final Check

- [ ] **Backend running** ✓
- [ ] **Frontend running** ✓
- [ ] **Can send messages** ✓
- [ ] **Responses stream** ✓
- [ ] **Sessions persist** ✓
- [ ] **No console errors** ✓
- [ ] **No linter errors** ✓

---

## 🎉 Success!

If all checks pass, your Fido AI is **ready to go!**

### Next Steps:

1. **Read `TOOL_EXAMPLES.md`**
2. **Add 2-3 tools you want most**
3. **Test them thoroughly**
4. **Build more!**

---

## 🆘 If Something Failed

### Check These First:

1. `.env` location (`app/api/.env`)
2. Backend logs for errors
3. Browser console (F12) for errors
4. Network tab for failed requests
5. Appwrite console for data

### Still Stuck?

1. Check `GETTING_STARTED.md` → Troubleshooting
2. Check `FIDO_SETUP.md` → Common Issues
3. Read the error message carefully
4. Check that all env vars are set
5. Restart both backend and frontend

### Nuclear Option:

```bash
# Clear everything and start fresh
rm -rf node_modules package-lock.json
npm install

rm -rf app/api/clone/__pycache__
pip install -r app/api/clone/requirements.txt --force-reinstall

# Clear browser data
# Open DevTools (F12) → Application → Clear storage

# Restart both servers
```

---

## 📝 Report Card

**Total Checks:** ~80  
**Completed:** ___  
**Failed:** ___  
**Skipped:** ___

**Status:** 🟢 Ready / 🟡 Mostly Ready / 🔴 Needs Work

**Notes:**

```
[Your notes here]
```

---

Good luck! 🚀

