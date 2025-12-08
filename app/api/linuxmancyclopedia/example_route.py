"""Example FastAPI route for streaming Linux command explanations."""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import AsyncGenerator, Iterable, List

import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from sentence_transformers import SentenceTransformer

from app.safety import get_danger_warning, is_dangerous

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "kwaipilot/kat-coder-pro:free")
SYSTEM_PROMPT_PATH = Path(__file__).with_name("system_prompt.txt")
SYSTEM_PROMPT = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")

EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL", "Snowflake/snowflake-arctic-embed-m-v2.0"
)
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "linux_commands")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_TIMEOUT = int(os.getenv("QDRANT_TIMEOUT", "60"))

_EMBEDDER = SentenceTransformer(
    EMBEDDING_MODEL_NAME, device=EMBEDDING_DEVICE, trust_remote_code=True
)
_QDRANT_CLIENT = (
    QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=QDRANT_TIMEOUT)
    if QDRANT_URL
    else QdrantClient(
        host=QDRANT_HOST, port=QDRANT_PORT, api_key=QDRANT_API_KEY, timeout=QDRANT_TIMEOUT
    )
)

router = APIRouter(prefix="/api/v1", tags=["linux explained"])


class ExplainCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=2000)


async def _encode_query(text: str) -> List[float]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: _EMBEDDER.encode(
            [text], normalize_embeddings=True, show_progress_bar=False
        )[0].tolist(),
    )


async def _search_context(vector: List[float], limit: int) -> List[qmodels.ScoredPoint]:
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        lambda: _QDRANT_CLIENT.search(
            collection_name=COLLECTION_NAME,
            query_vector=vector,
            limit=limit,
            with_payload=True,
        ),
    )


def _merge_context(points: Iterable[qmodels.ScoredPoint]) -> str:
    blocks: List[str] = []
    for point in points:
        payload = point.payload or {}
        document = payload.get("document", "")
        command = payload.get("command", "unknown")
        languages = ", ".join(payload.get("languages") or []) or "n/a"
        blocks.append(
            f"Command: {command} | Languages: {languages}\nScore: {point.score:.4f}\n{document}"
        )
    return "\n\n".join(blocks) if blocks else "Context unavailable."


def _build_user_message(command: str, context_blob: str, warning: str | None) -> str:
    parts = []
    if warning:
        parts.append(f"SAFETY_WARNING: {warning}")
    parts.append(f"User command: {command}")
    parts.append("Retrieved context:\n" + context_blob)
    return "\n\n".join(parts)


def _build_openrouter_payload(user_command: str, context_blob: str, warning: str | None) -> dict:
    return {
        "model": OPENROUTER_MODEL,
        "stream": True,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": _build_user_message(user_command, context_blob, warning),
            },
        ],
    }


def _sse_chunk(data: str, event: str | None = None) -> str:
    cleaned_lines = data.replace("\r", "").splitlines() or [""]
    parts = []
    if event:
        parts.append(f"event: {event}")
    for line in cleaned_lines:
        parts.append(f"data: {line}")
    parts.append("")
    return "\n".join(parts)


async def _openrouter_stream(payload: dict) -> AsyncGenerator[str, None]:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENROUTER_API_KEY is not configured",
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "https://linux.explained"),
        "X-Title": os.getenv("OPENROUTER_SITE_NAME", "Linux Explained"),
    }

    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", OPENROUTER_URL, headers=headers, json=payload) as response:
            if response.status_code >= 400:
                error_body = await response.aread()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_body.decode("utf-8", errors="ignore"),
                )
            async for raw_line in response.aiter_lines():
                if not raw_line or not raw_line.startswith("data:"):
                    continue
                data = raw_line.removeprefix("data:").strip()
                if data == "[DONE]":
                    break
                try:
                    parsed = json.loads(data)
                except json.JSONDecodeError:
                    continue
                delta = (
                    parsed.get("choices", [{}])[0]
                    .get("delta", {})
                    .get("content")
                )
                if delta:
                    yield delta


@router.post(
    "/explain",
    response_class=StreamingResponse,
    summary="Explain a Linux command with man-page + TLDR context",
)
async def explain_command(request: ExplainCommandRequest) -> StreamingResponse:
    command = request.command.strip()
    if not command:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Command cannot be empty."
        )

    warning = get_danger_warning() if is_dangerous(command) else None
    vector = await _encode_query(command)
    hits = await _search_context(vector, limit=5)
    context_blob = _merge_context(hits)
    payload = _build_openrouter_payload(command, context_blob, warning)

    async def event_stream() -> AsyncGenerator[str, None]:
        if warning:
            yield _sse_chunk(warning, event="warning")
        try:
            async for chunk in _openrouter_stream(payload):
                yield _sse_chunk(chunk, event="message")
        finally:
            yield _sse_chunk("[DONE]", event="done")

    headers = {
        "Cache-Control": "no-store",
        "Connection": "keep-alive",
    }
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=headers)

