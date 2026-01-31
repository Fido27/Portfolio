from __future__ import annotations

import argparse
import os
import time

from dotenv import load_dotenv

from appwrite.client import Client
from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query
from appwrite.services.databases import Databases
from appwrite.enums.index_type import IndexType


def env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing env var: {name}")
    return v


def ensure_attr_string(db: Databases, db_id: str, coll_id: str, key: str, *, size: int, required: bool) -> None:
    try:
        db.create_string_attribute(db_id, coll_id, key, size=size, required=required)
    except AppwriteException as e:
        # 409 = already exists (or conflict)
        if getattr(e, "code", None) != 409:
            raise


def ensure_attr_int(db: Databases, db_id: str, coll_id: str, key: str, *, required: bool) -> None:
    try:
        db.create_integer_attribute(db_id, coll_id, key, required=required)
    except AppwriteException as e:
        if getattr(e, "code", None) != 409:
            raise


def wait_attr_ready(db: Databases, db_id: str, coll_id: str, keys: list[str], timeout_s: float = 30.0) -> None:
    start = time.time()
    remaining = set(keys)
    while remaining and (time.time() - start) < timeout_s:
        done: set[str] = set()
        for k in list(remaining):
            try:
                a = db.get_attribute(db_id, coll_id, k)
                status = a.get("status") if isinstance(a, dict) else None
                if status in (None, "available"):
                    done.add(k)
            except AppwriteException:
                # Give it a moment to appear.
                pass
        remaining -= done
        if remaining:
            time.sleep(0.5)
    if remaining:
        raise RuntimeError(f"Timed out waiting for attributes to become available: {sorted(remaining)}")


def ensure_index(db: Databases, db_id: str, coll_id: str, *, key: str, type_: IndexType, attributes: list[str], orders: list[str] | None = None) -> None:
    try:
        db.create_index(db_id, coll_id, key=key, type=type_, attributes=attributes, orders=orders)
    except AppwriteException as e:
        if getattr(e, "code", None) != 409:
            raise


def upsert_user(db: Databases, db_id: str, users_coll: str, username: str) -> str:
    # If already exists, return its id.
    res = db.list_documents(db_id, users_coll, queries=[Query.equal("username", username), Query.limit(1)])
    docs = res.get("documents", []) if isinstance(res, dict) else []
    if docs:
        return str(docs[0].get("$id"))

    doc = db.create_document(db_id, users_coll, document_id=ID.unique(), data={"username": username})
    return str(doc.get("$id"))


def main() -> None:
    load_dotenv()

    parser = argparse.ArgumentParser()
    parser.add_argument("--username", default="Fido")
    args = parser.parse_args()

    endpoint = env("APPWRITE_ENDPOINT")
    project = env("APPWRITE_CLONE_PROJECT")
    api_key = env("APPWRITE_CLONE_API_KEY")

    db_id = env("APPWRITE_CLONE_DB_ID")
    users_coll = env("APPWRITE_CLONE_USERS_COLL_ID")
    sessions_coll = env("APPWRITE_CLONE_SESSIONS_COLL_ID")
    messages_coll = env("APPWRITE_CLONE_MESSAGES_COLL_ID")

    client = Client().set_endpoint(endpoint).set_project(project).set_key(api_key)
    db = Databases(client)

    # USERS schema
    ensure_attr_string(db, db_id, users_coll, "username", size=64, required=True)
    wait_attr_ready(db, db_id, users_coll, ["username"])
    ensure_index(db, db_id, users_coll, key="username_unique", type_=IndexType.UNIQUE, attributes=["username"])

    # SESSIONS schema
    ensure_attr_string(db, db_id, sessions_coll, "userId", size=64, required=True)
    ensure_attr_string(db, db_id, sessions_coll, "title", size=128, required=True)
    ensure_attr_string(db, db_id, sessions_coll, "personaId", size=32, required=True)
    ensure_attr_int(db, db_id, sessions_coll, "updatedAt", required=True)
    wait_attr_ready(db, db_id, sessions_coll, ["userId", "title", "personaId", "updatedAt"])
    # Composite index for (userId filter + updatedAt order)
    ensure_index(
        db,
        db_id,
        sessions_coll,
        key="userId_updatedAt",
        type_=IndexType.KEY,
        attributes=["userId", "updatedAt"],
        orders=["asc", "desc"],
    )

    # MESSAGES schema
    ensure_attr_string(db, db_id, messages_coll, "sessionId", size=64, required=True)
    ensure_attr_string(db, db_id, messages_coll, "role", size=16, required=True)
    ensure_attr_string(db, db_id, messages_coll, "content", size=10000, required=True)
    ensure_attr_int(db, db_id, messages_coll, "ts", required=True)
    wait_attr_ready(db, db_id, messages_coll, ["sessionId", "role", "content", "ts"])
    ensure_index(
        db,
        db_id,
        messages_coll,
        key="sessionId_ts",
        type_=IndexType.KEY,
        attributes=["sessionId", "ts"],
        orders=["asc", "asc"],
    )

    uid = upsert_user(db, db_id, users_coll, args.username)
    print(f"OK: user '{args.username}' is present (doc id: {uid})")


if __name__ == "__main__":
    main()

