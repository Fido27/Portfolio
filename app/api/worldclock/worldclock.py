from fastapi import APIRouter, HTTPException
from typing import Any, List
import os

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query


api = APIRouter(prefix="/Admin", tags=["Admin"])


def _db() -> Databases:
    """Create Databases client using WorldClock-specific env, with sane fallbacks.

    Preferred envs (if set):
      APPWRITE_WORLDCLOCK_ENDPOINT, APPWRITE_WORLDCLOCK_PROJECT, APPWRITE_WORLDCLOCK_API_KEY
    Fallbacks:
      APPWRITE_ENDPOINT, APPWRITE_PROJECT, APPWRITE_API_KEY
    """
    endpoint = os.environ.get("APPWRITE_WORLDCLOCK_ENDPOINT") or os.environ.get("APPWRITE_ENDPOINT", "http://localhost/v1")
    project = os.environ.get("APPWRITE_WORLDCLOCK_PROJECT") or os.environ.get("APPWRITE_PROJECT", "")
    api_key = os.environ.get("APPWRITE_WORLDCLOCK_API_KEY") or os.environ.get("APPWRITE_API_KEY", "")
    client = Client().set_endpoint(endpoint).set_project(project).set_key(api_key)
    return Databases(client)


def _ids() -> tuple[str, str]:
    """Resolve database/collection IDs for worldclock.

    Allows either dedicated env vars (APPWRITE_WORLDCLOCK_DB_ID/APPWRITE_WORLDCLOCK_COLL_ID)
    or falls back to generic APPWRITE_DATABASE_ID/APPWRITE_COLLECTION_ID.
    """
    # WorldClock-specific → WorldClock-specific (legacy) → generic
    db_id = (
        os.environ.get("APPWRITE_WORLDCLOCK_DB_ID")
        or os.environ.get("APPWRITE_WORLDCLOCK_DB_ID")
        or os.environ.get("APPWRITE_DATABASE_ID", "")
    )
    coll_id = (
        os.environ.get("APPWRITE_WORLDCLOCK_COLL_ID")
        or os.environ.get("APPWRITE_WORLDCLOCK_COLL_ID")
        or os.environ.get("APPWRITE_COLLECTION_ID", "")
    )
    return db_id, coll_id


@api.get("")
def list_worldclock(
    q: str | None = None,
    region: str | None = None,
    sort: str = "name:asc",
    page: int = 1,
    pageSize: int = 50,
):
    """List WorldClock with basic filtering/sorting/pagination.

    Returns { total, items } where items are Appwrite documents.
    """
    database_id, collection_id = _ids()
    if not (database_id and collection_id):
        raise HTTPException(status_code=500, detail="Appwrite database/collection IDs not configured")

    queries: List[Any] = []
    if q:
        queries.append(Query.search("name", q))
    if region:
        queries.append(Query.equal("region", [region]))

    field, direction = (sort.split(":") + ["asc"])[:2]
    queries.append(Query.order_desc(field) if direction == "desc" else Query.order_asc(field))
    queries.append(Query.limit(pageSize))
    queries.append(Query.offset(max(0, (page - 1) * pageSize)))

    db = _db()
    res = db.list_documents(database_id, collection_id, queries=queries)
    return {"total": res.get("total", 0), "items": res.get("documents", [])}


@api.get("/debug")
def debug():
    endpoint = os.environ.get("APPWRITE_WORLDCLOCK_ENDPOINT") or os.environ.get("APPWRITE_ENDPOINT")
    project = os.environ.get("APPWRITE_WORLDCLOCK_PROJECT") or os.environ.get("APPWRITE_PROJECT")
    has_key = bool(os.environ.get("APPWRITE_WORLDCLOCK_API_KEY") or os.environ.get("APPWRITE_API_KEY"))
    db_id, coll_id = _ids()
    info = {
        "endpoint": endpoint,
        "project_set": bool(project),
        "api_key_set": has_key,
        "db_id": db_id,
        "coll_id": coll_id,
    }
    try:
        db = _db()
        res = db.list_documents(db_id, coll_id, [Query.limit(1)])
        info.update({"list_ok": True, "documents_total": res.get("total", 0)})
    except Exception as e:
        info.update({"list_ok": False, "error": str(e)})
    return info


@api.get("/{code}")
def get_country(code: str):
    database_id, collection_id = _ids()
    if not (database_id and collection_id):
        raise HTTPException(status_code=500, detail="Appwrite database/collection IDs not configured")

    db = _db()
    res = db.list_documents(database_id, collection_id, [Query.equal("code", [code])])
    if res.get("total", 0) == 0:
        raise HTTPException(status_code=404, detail="Country not found")
    return res["documents"][0]