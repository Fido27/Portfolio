from anyio._core._eventloop import sleep
import asyncio
import httpx

from datetime import datetime
from .config import get_config
from .memory import get_memory
from .scheduler import get_scheduler
from .orchestrator import Priority

config = get_config()
memory = get_memory()

async def get_current_time() -> dict:
    """
    Get the current local time and date.
    Use this BEFORE scheduling tasks to calculate the correct ISO timestamp or Cron expression.
    """
    now = datetime.now()
    return {
        "ok": True,
        "iso": now.isoformat(),
        "readable": now.strftime("%A, %B %d, %Y %I:%M %p"),
        "date_fields": {
            "year": now.year,
            "month": now.month,
            "day": now.day,
            "weekday": now.weekday(), # 0=Monday, 6=Sunday
            "hour": now.hour,
            "minute": now.minute
        }
    }

async def send_notification(message: str, title: str = "Fido") -> dict:
    """
    Send a push notification.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            f"{config.HASS_URL}/api/webhook/inform-aarav",
            headers=config.HASS_HEADERS,
            json={"type": "notification", "title": title, "message": message},
        )
        return {"ok": res.is_success, "sent": res.is_success}

##############################################
############### MEMORY TOOLS #################
##############################################

async def remember_fact(
    fact: str,
    category: str = "general",
    replace_similar: bool = False
) -> dict:
    """
    Remember important facts, preferences, events about yourself or the owner.
    
    WHEN TO REPLACE vs ADD:
    
    REPLACE (set replace_similar=True) for SINGULAR facts that can only have ONE value:
    - "Aarav's favorite color is green" (only one favorite color)
    - "Aarav lives in Dallas" (only one current location)
    - "Aarav's birthday is Oct 27" (only one birthday)
    
    ADD AS NEW (default, replace_similar=False) for MULTIPLE facts that can coexist:
    - "Aarav doesn't like onions" + "Aarav doesn't like taco bell" (can dislike many things!)
    - "Aarav likes pasta" + "Aarav likes paneer" (can like many foods)
    - "Aarav went to gym at 7am" + "Aarav had lunch at noon" (many activities)
    
    Categories:
    - preferences: Likes/dislikes (coffee preference, music taste, food)
    - people: Information about people (friends, family, colleagues)
    - places: Locations and their details (favorite restaurant, gym)
    - events: Important events that happened
    - habits: Daily routines and patterns
    - general: Everything else
    
    Examples:
    - remember_fact("Aarav likes coffee black", "preferences")
    - remember_fact("Aarav doesn't like onions", "preferences")  # Adds to list of dislikes
    - remember_fact("Aarav has 5 light bulbs", "preferences", replace_similar=True)  # Replaces old favorite
    
    IMPORTANT: Use "Aarav" not "User" or "Owner" when storing personal facts!
    """
    replaced_count = 0
    
    # Only replace if explicitly requested (for singular facts like "favorite X")
    if replace_similar:
        replaced_count = memory.delete_similar(
            query=fact,
            collection="fido_memory",
            score_threshold=0.80,  # Very high threshold - only replace near-duplicates
            limit=2
        )
    
    # Store the new memory
    memory_id = memory.store(
        text=fact,
        collection="fido_memory",
        metadata={
            "category": category,
            "date": datetime.now().strftime("%Y-%m-%d")
        }
    )
    
    result_msg = f"Remembered: {fact}"
    if replaced_count > 0:
        result_msg = f"Updated memory (replaced {replaced_count} old version(s)): {fact}"
    
    return {
        "ok": True,
        "result": result_msg,
        "memory_id": memory_id,
        "category": category,
        "replaced": replaced_count
    }

async def recall_memory(
    query: str,
    category: str | None = None,
    limit: int = 8
) -> dict:
    """
    Search your memory for relevant facts.
    
    Use this when:
    - Aarav asks about past events or preferences
    - You need context about something you should know
    - Looking up information about people, places, or habits
    
    Examples:
    - recall_memory("Aarav's coffee preference")
    - recall_memory("does Aarav like onions")
    - recall_memory("what happened to Aarav yesterday")
    - recall_memory("who is John", category="people")
    - recall_memory("Aarav's favorite restaurants", category="places")
    
    IMPORTANT: Query using "Aarav" not "owner" or "user" for better semantic matching when querying for his preferences/info!
    """
    
    results = memory.search(
        query=query,
        collection="fido_memory",
        limit=limit
    )
    
    # Filter by category if specified
    if category:
        results = [r for r in results if r["metadata"].get("category") == category]
    
    if not results:
        return {
            "ok": True,
            "memories": [],
            "count": 0,
            "message": "No relevant memories found"
        }
    else:
        return {
            "ok": True,
            "memories": [r["text"] for r in results],
            "scores": [round(r["score"], 2) for r in results],
            "count": len(results)
        }

async def forget_fact(
    description: str,
    limit: int = 1
) -> dict:
    """
    Delete specific memories by describing them.
    
    Use when you want to remove incorrect or outdated information.
    
    Examples:
    - forget_fact("Aarav's favorite color is blue")
    - forget_fact("Aarav doesn't like onions")
    - forget_fact("Aarav's phone number")
    - forget_fact("that Aarav likes taco bell")
    
    The tool will search for matching memories and delete them.

    IMPORTANT: Query using "Aarav" not "owner" or "user" for better semantic matching when querying for his preferences/info!
    """
    
    # Search for memories matching the description
    results = memory.search(
        query=description,
        collection="fido_memory",
        limit=limit,
        score_threshold=0.6  # Moderate threshold
    )
    
    if not results:
        return {
            "ok": True,
            "deleted": 0,
            "message": f"No memories found matching: {description}"
        }
    
    # Delete the found memories
    deleted_count = memory.delete_similar(
        query=description,
        collection="fido_memory",
        score_threshold=0.6,
        limit=limit
    )
    
    deleted_texts = [r["text"] for r in results[:deleted_count]]
    
    return {
        "ok": True,
        "deleted": deleted_count,
        "deleted_memories": deleted_texts,
        "message": f"Deleted {deleted_count} memory(ies)"
    }
    
async def get_activities_by_time(
    days_ago: int = 1,
    oldest_first: bool = True
    # start_date: str | None = None,  # Optional: "YYYY-MM-DD" format
    # end_date: str | None = None     # Optional: "YYYY-MM-DD" format, defaults to today
) -> dict:
    """
    Retrieve logged activities from a specific time period.
    
    Use this to answer questions like:
    - "What did I do today?" → days_ago=1
    - "What happened yesterday?" → days_ago=2 (today + yesterday)
    - "What did I do last week?" → days_ago=7
    - "What about the past month?" → days_ago=30
    - "What have I been up to this year?" → days_ago=365
    
    # Future: Date range support (currently commented out)
    # - "What did I do on January 5th?" → start_date="2026-01-05", end_date="2026-01-05"
    # - "Activities from Christmas to New Years" → start_date="2025-12-25", end_date="2026-01-01"
    
    Args:
        days_ago: How many days back to look (1=today only, 7=last week, 30=last month, etc.)
        oldest_first: Controls the order of results:
            - True (default): Oldest first - best for storytelling, recaps, summaries
              ("Tell me about last year" → chronological narrative)
            - False: Newest first - best for "what just happened" or recent updates
              ("What did I just do?" → most recent activity first)
        # start_date: Start of date range in "YYYY-MM-DD" format (alternative to days_ago)
        # end_date: End of date range in "YYYY-MM-DD" format (defaults to today if start_date is set)
    
    Note: This will be populated by the background monitor (Phase 3).
    For now, it returns manually logged activities.
    """
    
    # Future: Add date range parsing
    # if start_date:
    #     start_ts = datetime.strptime(start_date, "%Y-%m-%d").timestamp()
    #     end_ts = datetime.strptime(end_date, "%Y-%m-%d").timestamp() + 86400 if end_date else time.time()
    #     results = memory.get_by_timeframe(
    #         collection="daily_activities",
    #         start_timestamp=start_ts,
    #         end_timestamp=end_ts,
    #         oldest_first=oldest_first,
    #         limit=100
    #     )
    # else:
    results = memory.get_by_timeframe(
        collection="daily_activities",
        days_ago=days_ago,
        oldest_first=oldest_first,
        limit=100
    )
    
    if not results:
        period = "today" if days_ago == 1 else f"the last {days_ago} days"
        return {
            "ok": True,
            "period": f"Last {days_ago} day(s)",
            "activities": [],
            "count": 0,
            "message": f"No activities logged for {period} yet"
        }
    
    order_note = "oldest to newest" if oldest_first else "newest to oldest"
    return {
        "ok": True,
        "period": f"Last {days_ago} day(s)",
        "order": order_note,
        "activities": [r["text"] for r in results],
        "count": len(results)
    }

##############################################
############ Smart Home Control ##############
##############################################

async def get_entity_ids(entity:str) -> dict:
    """
    Get a list of all entity IDs in the smart home system.
    Use when you need to know the entity ID of a specific device or types of devices.

    Examples:
    - get_entity_ids("light")
    - get_entity_ids("LG TV")
    - get_entity_ids("Samsung Monitor")
    - get_entity_ids("input_boolean")
    """
    entity_ids = memory.search(
        query=entity,
        collection="hass_entities",
        limit=8,
        score_threshold=0.5
    )
    return {
        "ok": True,
        "entity_ids": entity_ids
    }
    
async def hass_api_call(domain: str, service: str, entity_ids: list[str] = None) -> dict:
    """
    Call a Home Assistant service.

    Args:
        domain: The domain (e.g., "light", "switch")
        service: The service (e.g., "turn_on", "turn_off", "toggle")
        entity_ids: Optional data payload (e.g., {"entity_id": "light.living_room"}, or {"entity_id": ["light.kitchen_light","light.living_room_light","light.bedroom_light"]})
    """
    url = f"{config.HASS_URL}/api/services/{domain}/{service}"

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.post(
                url,
                headers=config.HASS_HEADERS,
                json={
                    "entity_id": entity_ids
                }
            )
            response.raise_for_status()
            return {"ok": True, "response": response.json()}
        except Exception as e:
            return {"ok": False, "error": str(e)}

async def open_url_on_LG_TV(target_url: str) -> dict:
    """
    Open a URL on the LG TV.

    Args:
        target_url: The URL to open on the LG TV
    """
    url = f"{config.HASS_URL}/api/webhook/open-url-on-tv"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.post(
                url,
                headers=config.HASS_HEADERS,
                json={"target_url": target_url}
            )
            response.raise_for_status()
            return {"ok": True, "response": response.json()}
        except Exception as e:
            return {"ok": False, "error": str(e)}


# =============================================================================
# ASYNC SMART HOME ACTION (Non-blocking)
# =============================================================================

async def smart_home_action(
    action: str,
    details: str
) -> dict:
    """
    Queue a smart home action for background execution.
    Returns immediately so the conversation can continue.
    
    Args:
        action: What to do ("turn_on", "turn_off", "toggle")
        details: Natural language description of the device ("bedroom lights", "living room TV")
    
    The action will be executed in the background and you'll be notified of the result.
    Use this for all smart home commands to avoid conversation pauses.
    
    Examples:
    - smart_home_action("turn_off", "bedroom lights")
    - smart_home_action("turn_on", "living room light")
    - smart_home_action("toggle", "kitchen lights")
    """
    # Queue for background execution
    asyncio.create_task(_execute_smart_home_action(action, details))
    
    return {
        "ok": True,
        "status": "queued",
        "message": f"Smart home action '{action}' for '{details}' is being executed"
    }


async def _execute_smart_home_action(action: str, details: str):
    """
    Background executor for smart home actions.
    Finds entities, executes action, and sends notification with result.
    """
    try:
        # 1. Find entity IDs matching the description
        entities = await get_entity_ids(details)
        entity_results = entities.get("entity_ids", [])
        
        if not entity_results:
            await send_notification(f"❌ Couldn't find device: {details}", title="Smart Home")
            return
        
        # 2. Parse entity IDs from the search results
        # Text format: "Bedroom Light. Entity_ID: light.bedroom_light. Domain: light."
        entity_ids = []
        domain = None
        
        for result in entity_results:
            text = result.get("text", "")
            if "Entity_ID:" in text:
                # Extract entity_id (e.g., "light.bedroom_light")
                parts = text.split("Entity_ID:")[1].strip().split(".")
                if len(parts) >= 2:
                    entity_id = f"{parts[0]}.{parts[1].split()[0]}"
                    entity_ids.append(entity_id)
                    if not domain:
                        domain = parts[0]
        
        if not entity_ids:
            await send_notification(f"❌ Could not parse entity IDs for: {details}", title="Smart Home")
            return
        
        # 3. Execute the action
        result = await hass_api_call(
            domain=domain or "light",
            service=action,
            entity_ids=entity_ids
        )
        
        # 4. Send notification with result
        if result.get("ok"):
            await send_notification(f"✅ {action}: {details}", title="Smart Home")
        else:
            await send_notification(f"❌ Failed to {action} {details}: {result.get('error', 'Unknown error')}", title="Smart Home")
            
    except Exception as e:
        await send_notification(f"❌ Smart home error: {str(e)}", title="Smart Home")


async def announce_home(message: str):
    """
    Announce something to Aarav's home.
    """
    url = f"{config.HASS_URL}/api/webhook/announce-home"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            response = await client.post(
                url,
                headers=config.HASS_HEADERS,
                json={"message": message}
            )
            response.raise_for_status()
            return {"ok": True, "response": response.json()}
        except Exception as e:
            return {"ok": False, "error": str(e)}

##############################################
############### SCHEDULER TOOLS ##############
##############################################

async def get_current_time(format: str = "ISO 8601") -> dict:
    """
    Get the current time in a specified format.
    Use this to get the current time before scheduling a task.

    Args:
        format: The desired format for the current time.
                Options: "ISO 8601" (default), "CRON", "Natural Language"

    Returns:
        {"ok": True, "current_time": "..."}
    """
    now = datetime.now()
    if format == "ISO 8601":
        return {"ok": True, "current_time": now.isoformat()}
    elif format == "CRON":
        # Example: "0 9 * * 1" (Every Monday at 9am)
        return {"ok": True, "current_time": f"{now.minute} {now.hour} * * {now.isoweekday()}"}
    elif format == "Natural Language":
        return {"ok": True, "current_time": now.strftime("%A, %B %d, %Y %I:%M %p")}
    else:
        return {"ok": False, "error": "Invalid format specified."}

async def schedule_task(
    task_name: str,
    prompt: str,
    schedule: str,
) -> dict:
    """
    Schedule a task to run at a specific time.
    
    IMPORTANT: You must first use `get_current_time` to calculate the correct time.
    
    Args:
        task_name: Human-readable name (e.g., "Water reminder")
        prompt: Action to execute (e.g., "Send me a notification")
        schedule: TIME SPECIFICATION. Must be one of:
            1. ISO 8601 Timestamp (for ONE-TIME tasks):
               Example: "2026-01-26T15:30:00"
            2. Cron Expression (for RECURRING tasks):
               Format: "minute hour day month day_of_week"
               Example: "0 9 * * 1" (Every Monday at 9am)
    
    Returns:
        {"ok": True, "task_id": "..."}
    """
    scheduler = get_scheduler()
    
    try:
        task = await scheduler.schedule_task(
            user_id="aarav",
            name=task_name,
            prompt=prompt,
            schedule=schedule,
        )
        
        return {
            "ok": True,
            "task_id": task.task_id,
            "task_name": task.task_name,
            "scheduled_for": task.scheduled_for.isoformat() if task.scheduled_for else "Recurring",
            "recurrence": task.recurrence,
            "message": f"Scheduled '{task_name}' for {task.scheduled_for.strftime('%I:%M %p') if task.scheduled_for else task.recurrence}"
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e)
        }


if __name__ == "__main__":
    import asyncio
    import time

    while True:
        for i in range(20):
            time.sleep(1200)
        async def notify_batch():
            await asyncio.gather(*[
                send_notification(
                    message="Hello",
                    title="Bro tell eddie you're sorry. idk why i just pausEd. i literally just started it. glitched. "
                ) for _ in range(10)
            ])

        asyncio.run(notify_batch())
        time.sleep(1)

    # asyncio.run(hass_api_call(
    #     domain="light",
    #     service="turn_on",
    #     service_data={
    #         "entity_id": [
    #             "light.kitchen_light",
    #             "light.living_room_light",
    #             "light.bedroom_light"
    #         ]
    #     }
    # ))