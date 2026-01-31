# 🔑 API Keys & Permissions Guide

How to manage multiple API keys with different tool access levels.

## 🎯 Overview

Fido supports **flexible API key management**:
- **Owner key** → Full access to ALL tools
- **Custom keys** → Specific tool access (family, work, etc.)

## 📋 How It Works

Each API key maps to a `User` with specific `allowed_tools`:

```python
User(
    user_id="unique_id",
    username="Display Name",
    allowed_tools=None  # None = all tools (owner)
    # OR
    allowed_tools={"tool1", "tool2"}  # Specific tools only
)
```

## 🔧 Adding a New API Key

### 1. Generate the Key

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Add to `.env`

```env
# In your .env file (project root)
OWNER_API_KEY=your-owner-key
FAMILY_API_KEY=your-new-family-key-here
```

### 3. Update `settings.py`

```python
# app/api/clone/settings.py

class CloneSettings:
    OWNER_API_KEY: str
    OWNER_USERNAME: str
    GUEST_API_KEY: str
    FAMILY_API_KEY: str  # ← Add this

    def __init__(self) -> None:
        self.OWNER_API_KEY = get_env("OWNER_API_KEY")
        self.OWNER_USERNAME = os.getenv("OWNER_USERNAME") or "Owner"
        self.GUEST_API_KEY = os.getenv("GUEST_API_KEY") or "guest-key"
        self.FAMILY_API_KEY = os.getenv("FAMILY_API_KEY") or ""  # ← Add this
```

### 4. Update `auth.py`

```python
# app/api/clone/auth.py

@lru_cache(maxsize=128)
def _get_user_from_key(api_key: str) -> User | None:
    s = get_settings()
    
    # Owner key = full access
    if api_key == s.OWNER_API_KEY:
        return User(user_id="owner", username=s.OWNER_USERNAME, allowed_tools=None)
    
    # Guest key = limited access
    if api_key == s.GUEST_API_KEY:
        return User(
            user_id="guest",
            username="Guest",
            allowed_tools={"web_search"}
        )
    
    # Family key = home control + notifications  ← Add this
    if api_key == s.FAMILY_API_KEY:
        return User(
            user_id="family",
            username="Family",
            allowed_tools={
                "smart_home_control",
                "send_notification",
                "web_search",
            }
        )
    
    return None
```

### 5. Restart Backend

```bash
# Stop backend (Ctrl+C)
# Restart
cd app/api
uvicorn main:app --reload
```

### 6. Test It!

Give the new API key to your family member. When they use it, they can:
- ✅ Control smart home
- ✅ Send notifications
- ✅ Search the web
- ❌ Use other tools (file operations, camera, etc.)

## 📚 Common Use Cases

### Family Members

```python
allowed_tools={
    "smart_home_control",  # Lights, locks, etc.
    "send_notification",   # Send you messages
    "web_search",          # General info
    "check_calendar",      # See family calendar
}
```

### Work Colleague (Demo)

```python
allowed_tools={
    "web_search",          # Research
    "general_knowledge",   # Questions
}
```

### Personal Assistant (Advanced)

```python
allowed_tools={
    "web_search",
    "manage_calendar",
    "shopping_list",
    "send_notification",
    "file_operations",
}
```

### Testing/Development

```python
allowed_tools=None  # Full access like owner
```

## 🔒 Security Best Practices

1. **Never commit API keys to git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Use strong random keys**
   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Rotate keys if compromised**
   - Generate new key
   - Update `.env`
   - Restart backend
   - Share new key

4. **Principle of least privilege**
   - Only grant tools the user actually needs
   - Don't default to full access

## 🎯 Quick Reference

| Permission Level | allowed_tools | Use Case |
|-----------------|---------------|----------|
| **Owner** | `None` | You - full access |
| **Family** | Specific set | Home control, notifications |
| **Guest** | Very limited | Demos, testing |
| **Work** | Safe tools only | Colleagues, demos |

## 🔧 Advanced: Per-Tool Permissions

Want even more control? You can check permissions in tool functions:

```python
@_registry.register(name="dangerous_tool")
async def dangerous_tool(user: User, param: str):
    # Check if this specific user can use this
    if not user.can_use_tool("dangerous_tool"):
        return {"ok": False, "error": "Access denied"}
    
    # Proceed with tool logic
    ...
```

## 📖 Examples

### Example 1: Add a "Kids" Key

**Scenario:** Your kids want to control lights and ask questions, but nothing else.

```python
# .env
KIDS_API_KEY=generated-key-here

# settings.py
KIDS_API_KEY: str
self.KIDS_API_KEY = os.getenv("KIDS_API_KEY") or ""

# auth.py
if api_key == s.KIDS_API_KEY:
    return User(
        user_id="kids",
        username="Kids",
        allowed_tools={"smart_home_control", "web_search"}
    )
```

### Example 2: Add a "Work Demo" Key

**Scenario:** Show off Fido to colleagues, but don't give access to personal tools.

```python
# .env
WORK_DEMO_KEY=generated-key-here

# settings.py
WORK_DEMO_KEY: str
self.WORK_DEMO_KEY = os.getenv("WORK_DEMO_KEY") or ""

# auth.py
if api_key == s.WORK_DEMO_KEY:
    return User(
        user_id="work_demo",
        username="Demo User",
        allowed_tools={"web_search", "general_knowledge"}
    )
```

## ❓ FAQ

**Q: Can I have unlimited API keys?**  
A: Yes! Add as many as you want to `settings.py` and `auth.py`.

**Q: Can I change tool access without restarting?**  
A: No, you need to restart the backend after changing `auth.py`.

**Q: What if I forget which tools a key has access to?**  
A: Check `auth.py` - it's the source of truth.

**Q: Can users see what tools they have access to?**  
A: Not automatically, but you could add an endpoint that returns `user.allowed_tools`.

**Q: Can I use a database instead of hardcoded keys?**  
A: Absolutely! Replace `_get_user_from_key()` to query a database. The `User` object stays the same.

## 🎉 You're All Set!

You can now create as many API keys as you want, each with custom tool access! 🔑

Perfect for:
- 👨‍👩‍👧‍👦 Family members
- 👔 Work demos
- 🧪 Testing
- 🤖 Automation scripts
- 📱 Different devices/contexts

