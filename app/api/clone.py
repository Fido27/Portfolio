from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
import os
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from fastapi import HTTPException
import asyncio

api = APIRouter(prefix="/clone")


class UpsertRequest(BaseModel):
    username: str
    sessions: Any | None = None
    activeId: str | None = None


def _db() -> Databases:
    client = (
        Client()
        .set_endpoint(os.environ.get("APPWRITE_ENDPOINT", "http://localhost/v1"))
        .set_project(os.environ.get("APPWRITE_PROJECT", ""))
        .set_key(os.environ.get("APPWRITE_API_KEY", ""))
    )
    return Databases(client)

def _ensure_schema(db: Databases, database_id: str, collection_id: str):
    """Best-effort create attributes and a unique index for username.
    If they already exist, ignore errors.
    """
    try:
        # username: string(64), required, not array
        db.create_string_attribute(database_id, collection_id, key="username", size=64, required=True)
    except Exception:
        pass
    try:
        # sessions: json, optional
        db.create_json_attribute(database_id, collection_id, key="sessions", required=False)
    except Exception:
        pass
    try:
        # activeId: string(64), optional
        db.create_string_attribute(database_id, collection_id, key="activeId", size=64, required=False)
    except Exception:
        pass
    try:
        # unique index on username
        db.create_index(database_id, collection_id, key="username_unique", type="unique", attributes=["username"], orders=["ASC"])
    except Exception:
        pass

def ensure_collection_ready():
    """Initialize collection attributes/index if missing. Returns status dict."""
    database_id = os.environ.get("APPWRITE_DATABASE_ID", "")
    collection_id = os.environ.get("APPWRITE_COLLECTION_ID", "")
    try:
        db = _db()
        _ensure_schema(db, database_id, collection_id)
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@api.post("/user/upsert")
async def upsert_user(req: UpsertRequest):
    database_id = os.environ.get("APPWRITE_DATABASE_ID", "")
    collection_id = os.environ.get("APPWRITE_COLLECTION_ID", "")
    db = _db()
    from appwrite.query import Query
    data = {"username": req.username, "sessions": req.sessions or [], "activeId": req.activeId}
    try:
        if not (database_id and collection_id):
            raise HTTPException(status_code=500, detail="APPWRITE_DATABASE_ID or APPWRITE_COLLECTION_ID not set")
        _ensure_schema(db, database_id, collection_id)
        # Find existing by username
        res = db.list_documents(database_id, collection_id, [Query.equal("username", req.username)])
        if res.get("total", 0) > 0:
            doc = res["documents"][0]
            updated = db.update_document(database_id, collection_id, doc["$id"], data)
            return {"status": "updated", "doc": updated}
        # Create new with unique ID. Retry if attributes/index still initializing.
        last_err = None
        for attempt in range(6):
            try:
                created = db.create_document(
                    database_id,
                    collection_id,
                    document_id=ID.unique(),
                    data=data,
                    permissions=[],
                )
                return {"status": "created", "doc": created}
            except Exception as e:
                last_err = e
                msg = str(e).lower()
                if "not ready" in msg or "processing" in msg or "index" in msg:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                raise
        raise HTTPException(status_code=500, detail=f"create failed: {last_err}")
    except Exception as e:
        return {"error": str(e)}


@api.get("/user/{username}")
async def get_user(username: str):
    database_id = os.environ.get("APPWRITE_DATABASE_ID", "")
    collection_id = os.environ.get("APPWRITE_COLLECTION_ID", "")
    db = _db()
    from appwrite.query import Query
    try:
        res = db.list_documents(database_id, collection_id, [Query.equal("username", username)])
        if res.get("total", 0) == 0:
            return {"exists": False}
        doc = res["documents"][0]
        return {"exists": True, "doc": doc}
    except Exception as e:
        return {"error": str(e)}


@api.get("/debug")
async def debug():
    database_id = os.environ.get("APPWRITE_DATABASE_ID", "")
    collection_id = os.environ.get("APPWRITE_COLLECTION_ID", "")
    project = os.environ.get("APPWRITE_PROJECT", "")
    endpoint = os.environ.get("APPWRITE_ENDPOINT", "")
    info = {
        "endpoint": endpoint,
        "projectLooksLikeId": bool(project and (project[0].isdigit() or len(project) > 12)),
        "projectValue": project,
        "databaseId": database_id,
        "collectionId": collection_id,
    }
    try:
        db = _db()
        _ensure_schema(db, database_id, collection_id)
        from appwrite.query import Query
        res = db.list_documents(database_id, collection_id, [Query.limit(1)])
        info.update({"list_ok": True, "documents_total": res.get("total", 0)})
    except Exception as e:
        info.update({"list_ok": False, "error": str(e)})
    return info