from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import ollama

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.query import Query

try:
    # Optional dependency to enable web search within the agent
    from duckduckgo_search import DDGS  # type: ignore
    import requests  # type: ignore
except Exception:  # pragma: no cover - optional
    DDGS = None
    requests = None


api = APIRouter(prefix="/admin", tags=["admin", "ai"])


# -----------------------------
# Appwrite DB utilities (safe)
# -----------------------------

def _db() -> Databases:
    endpoint = (
        os.environ.get("APPWRITE_WORLDCLOCK_ENDPOINT")
        or os.environ.get("APPWRITE_COUNTRIES_ENDPOINT")
        or os.environ.get("APPWRITE_ENDPOINT", "http://localhost/v1")
    )
    project = (
        os.environ.get("APPWRITE_WORLDCLOCK_PROJECT")
        or os.environ.get("APPWRITE_COUNTRIES_PROJECT")
        or os.environ.get("APPWRITE_PROJECT", "")
    )
    api_key = (
        os.environ.get("APPWRITE_WORLDCLOCK_API_KEY")
        or os.environ.get("APPWRITE_COUNTRIES_API_KEY")
        or os.environ.get("APPWRITE_API_KEY", "")
    )
    client = Client().set_endpoint(endpoint).set_project(project).set_key(api_key)
    return Databases(client)


def _ids() -> tuple[str, str]:
    database_id = (
        os.environ.get("APPWRITE_WORLDCLOCK_DB_ID")
        or os.environ.get("APPWRITE_COUNTRIES_DB_ID")
        or os.environ.get("APPWRITE_DATABASE_ID", "")
    )
    collection_id = (
        os.environ.get("APPWRITE_WORLDCLOCK_COLL_ID")
        or os.environ.get("APPWRITE_COUNTRIES_COLL_ID")
        or os.environ.get("APPWRITE_COLLECTION_ID", "")
    )
    return database_id, collection_id


def _ensure_schema(db: Databases, database_id: str, collection_id: str) -> None:
    """Best-effort create attributes and indices for countries collection.

    - code: ISO3 uppercase, string(3), required, unique (stored also as $id)
    - name: string(128)
    - capital: string(128)
    - region: string(64)
    - gpi_rank: string(8) like "#24"
    - weather: json
    - last_updated: integer (epoch seconds)
    """
    try:
        db.create_string_attribute(database_id, collection_id, key="code", size=8, required=True)
    except Exception:
        pass
    for attr, size, required in (
        ("name", 128, False),
        ("capital", 128, False),
        ("region", 64, False),
        ("gpi_rank", 8, False),
    ):
        try:
            db.create_string_attribute(database_id, collection_id, key=attr, size=size, required=required)
        except Exception:
            pass
    try:
        db.create_json_attribute(database_id, collection_id, key="weather", required=False)
    except Exception:
        pass
    try:
        db.create_integer_attribute(database_id, collection_id, key="last_updated", required=False)
    except Exception:
        pass
    try:
        db.create_index(database_id, collection_id, key="code_unique", type="unique", attributes=["code"], orders=["ASC"])
    except Exception:
        pass


ALLOWED_UPDATE_FIELDS = {"name", "capital", "region", "gpi_rank", "weather", "last_updated"}


def _normalize_iso3(code: str) -> str:
    if not code or len(code.strip()) < 3:
        raise HTTPException(status_code=400, detail="Invalid ISO3 code")
    return code.strip().upper()


def _safe_partial_update(existing: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    """Return a new dict containing only allowed updates merged onto existing.

    - Only keys in ALLOWED_UPDATE_FIELDS are considered
    - Values that are None are ignored (no deletion)
    - Adds/updates last_updated automatically if present or if updates include weather/gpi_rank
    """
    merged = dict(existing)
    did_change = False
    for key, value in updates.items():
        if key not in ALLOWED_UPDATE_FIELDS:
            continue
        if value is None:
            continue
        if merged.get(key) != value:
            merged[key] = value
            did_change = True
    if did_change:
        merged["last_updated"] = int(time.time())
    return merged


def _get_doc_by_id(db: Databases, database_id: str, collection_id: str, doc_id: str) -> Optional[Dict[str, Any]]:
    try:
        res = db.get_document(database_id, collection_id, doc_id)
        return res
    except Exception:
        return None


def upsert_country(code: str, data: Dict[str, Any], create_if_missing: bool = True) -> Dict[str, Any]:
    database_id, collection_id = _ids()
    if not (database_id and collection_id):
        raise HTTPException(status_code=500, detail="Appwrite database/collection IDs not configured")
    db = _db()
    _ensure_schema(db, database_id, collection_id)

    iso3 = _normalize_iso3(code)
    existing = _get_doc_by_id(db, database_id, collection_id, iso3)

    # Ensure code field mirrors ID
    base_data = {"code": iso3}
    sanitized = _safe_partial_update(base_data, data)

    if existing is None:
        if not create_if_missing:
            raise HTTPException(status_code=404, detail="Document not found and create_if_missing=False")
        created = db.create_document(
            database_id,
            collection_id,
            document_id=iso3,
            data=sanitized,
            permissions=[],
        )
        return {"status": "created", "doc": created}

    # Partial update: compute minimal diff
    patch = {}
    for k in ALLOWED_UPDATE_FIELDS.union({"code"}):
        new_val = sanitized.get(k)
        if new_val is None:
            continue
        if existing.get(k) != new_val:
            patch[k] = new_val
    if patch:
        updated = db.update_document(database_id, collection_id, iso3, patch)
        return {"status": "updated", "doc": updated}
    return {"status": "noop", "doc": existing}


def bulk_upsert_countries(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    for item in items:
        code = _normalize_iso3(item.get("iso3") or item.get("code", ""))
        data = {
            "name": item.get("name"),
            "capital": item.get("capital"),
            "region": item.get("region"),
        }
        results.append(upsert_country(code, data))
    return {"ok": True, "results": results}


def bulk_update_gpi(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    for e in entries:
        code = _normalize_iso3(e.get("iso3") or e.get("code", ""))
        rank = e.get("rank") or e.get("gpi_rank")
        if isinstance(rank, int):
            rank_str = f"#{rank}"
        else:
            rank_str = str(rank).strip()
            if rank_str and not rank_str.startswith("#"):
                rank_str = f"#{rank_str}"
        results.append(upsert_country(code, {"gpi_rank": rank_str}, create_if_missing=False))
    return {"ok": True, "results": results}


def bulk_update_weather(entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    results: List[Dict[str, Any]] = []
    for e in entries:
        code = _normalize_iso3(e.get("iso3") or e.get("code", ""))
        weather = e.get("weather")
        if not isinstance(weather, dict):
            continue
        results.append(upsert_country(code, {"weather": weather}, create_if_missing=False))
    return {"ok": True, "results": results}


# -----------------------------
# FastAPI direct CRUD endpoints
# -----------------------------


class CountryItem(BaseModel):
    iso3: str = Field(..., description="ISO3 country code to use as document id")
    name: Optional[str] = None
    capital: Optional[str] = None
    region: Optional[str] = None


class BulkCountriesRequest(BaseModel):
    countries: List[CountryItem]


@api.post("/countries/upsert")
def upsert_countries(req: BulkCountriesRequest):
    items = [c.model_dump() for c in req.countries]
    return bulk_upsert_countries(items)


class GPIRankEntry(BaseModel):
    iso3: str
    rank: str | int


class UpdateGPIRequest(BaseModel):
    entries: List[GPIRankEntry]


@api.post("/countries/update/gpi")
def update_gpi(req: UpdateGPIRequest):
    items = [e.model_dump() for e in req.entries]
    return bulk_update_gpi(items)


class WeatherEntry(BaseModel):
    iso3: str
    weather: Dict[str, Any]


class UpdateWeatherRequest(BaseModel):
    entries: List[WeatherEntry]


@api.post("/countries/update/weather")
def update_weather(req: UpdateWeatherRequest):
    items = [e.model_dump() for e in req.entries]
    return bulk_update_weather(items)


# -----------------------------
# Ollama Agent with Tool-Calling
# -----------------------------


def _tool_spec() -> List[Dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": "add_countries",
                "description": "Create or update countries. Document id must be ISO3 code.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "countries": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "iso3": {"type": "string"},
                                    "name": {"type": "string"},
                                    "capital": {"type": "string"},
                                    "region": {"type": "string"},
                                },
                                "required": ["iso3"],
                            },
                        }
                    },
                    "required": ["countries"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_gpi_ranks",
                "description": "Update Global Peace Index ranks formatted like '#24' for existing countries.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "entries": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "iso3": {"type": "string"},
                                    "rank": {"oneOf": [{"type": "string"}, {"type": "integer"}]},
                                },
                                "required": ["iso3", "rank"],
                            },
                        }
                    },
                    "required": ["entries"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "update_capital_weather",
                "description": "Update weather objects for existing countries (expects pre-fetched weather objects).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "entries": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "iso3": {"type": "string"},
                                    "weather": {"type": "object"},
                                },
                                "required": ["iso3", "weather"],
                            },
                        }
                    },
                    "required": ["entries"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web for information. Returns top results (title, url, snippet).",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "http_get",
                "description": "Fetch content from a URL (text only). Use responsibly.",
                "parameters": {
                    "type": "object",
                    "properties": {"url": {"type": "string"}},
                    "required": ["url"],
                },
            },
        },
    ]


def _dispatch_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    if name == "add_countries":
        countries = arguments.get("countries", [])
        return bulk_upsert_countries(countries)
    if name == "update_gpi_ranks":
        entries = arguments.get("entries", [])
        return bulk_update_gpi(entries)
    if name == "update_capital_weather":
        entries = arguments.get("entries", [])
        return bulk_update_weather(entries)
    if name == "search_web":
        query = arguments.get("query", "")
        if not DDGS:
            return {"ok": False, "error": "web search disabled: missing dependency"}
        try:
            with DDGS() as ddgs:  # type: ignore
                results = list(ddgs.text(query, max_results=5))
            simplified = [
                {
                    "title": r.get("title"),
                    "url": r.get("href") or r.get("url"),
                    "snippet": r.get("body") or r.get("snippet"),
                }
                for r in results
            ]
            return {"ok": True, "results": simplified}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    if name == "http_get":
        url = arguments.get("url", "")
        if not requests:
            return {"ok": False, "error": "http get disabled: missing dependency"}
        try:
            resp = requests.get(url, timeout=20)
            content_type = resp.headers.get("content-type", "")
            if "text" not in content_type and "json" not in content_type:
                return {"ok": False, "status": resp.status_code, "content_type": content_type, "truncated": True, "text": "non-text response"}
            text = resp.text
            if len(text) > 25000:
                text = text[:25000]
            return {"ok": True, "status": resp.status_code, "text": text}
        except Exception as e:
            return {"ok": False, "error": str(e)}
    return {"ok": False, "error": f"unknown tool {name}"}


class AgentRequest(BaseModel):
    prompt: str
    model: Optional[str] = Field(default=os.environ.get("OLLAMA_MODEL", "llama3"))
    max_steps: int = 8


@api.post("/agent/run")
def run_agent(req: AgentRequest):
    """Run an Ollama tool-using agent for country database tasks.

    Safety:
    - Only exposes curated tools that perform safe, partial updates
    - Disallows arbitrary code execution
    - Limits HTTP and search responses size
    """
    system_msg = (
        "You are a data operations agent for an Appwrite collection of countries. "
        "Follow the user's instructions exactly. Use tools to: (1) add countries (doc id = ISO3), (2) update GPI ranks like '#24', (3) update capital weather objects. "
        "Only write allowed fields. Never delete data. Prefer partial updates."
    )

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": req.prompt},
    ]

    tools = _tool_spec()
    steps = 0
    transcript: List[Dict[str, Any]] = []
    while steps < max(1, min(req.max_steps, 12)):
        steps += 1
        response = ollama.chat(
            model=req.model,
            messages=messages,
            tools=tools,
        )
        msg = response.get("message", {})
        transcript.append({"assistant": msg})

        tool_calls = msg.get("tool_calls") or []
        if tool_calls:
            for call in tool_calls:
                name = call.get("function", {}).get("name")
                raw_args = call.get("function", {}).get("arguments", "{}")
                try:
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception:
                    args = {}
                result = _dispatch_tool(name, args)
                messages.append(
                    {
                        "role": "tool",
                        "content": json.dumps(result, ensure_ascii=False),
                        "name": name,
                    }
                )
                transcript.append({"tool_result": {"name": name, "result": result}})
            # continue loop to let the model observe tool outputs
            continue

        content = msg.get("content", "").strip()
        messages.append({"role": "assistant", "content": content})
        # If model declares done, break
        if content:
            break

    return {
        "ok": True,
        "steps": steps,
        "final_message": messages[-1] if messages else None,
        "transcript": transcript[-6:],
    }


@api.get("/debug")
def debug():
    database_id, collection_id = _ids()
    endpoint = os.environ.get("APPWRITE_COUNTRIES_ENDPOINT") or os.environ.get("APPWRITE_ENDPOINT")
    project = os.environ.get("APPWRITE_COUNTRIES_PROJECT") or os.environ.get("APPWRITE_PROJECT")
    return {
        "endpoint": endpoint,
        "project_set": bool(project),
        "db_id": database_id,
        "collection_id": collection_id,
        "ollama_model": os.environ.get("OLLAMA_MODEL", "llama3"),
        "web_search_enabled": bool(DDGS),
    }


