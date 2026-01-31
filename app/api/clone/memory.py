from __future__ import annotations

import time
from functools import lru_cache
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct
from google import genai

from .config import get_config


@lru_cache(maxsize=1)
def get_qdrant_client() -> QdrantClient:
    """Get Qdrant client (cached)"""
    s = get_config()
    return QdrantClient(
        url=s.QDRANT_URL,
        api_key=s.QDRANT_API_KEY
    )


@lru_cache(maxsize=1)
def get_genai_client() -> genai.Client:
    """Get Google GenAI client (cached)."""
    config = get_config()
    return genai.Client(api_key=config.GEMINI_API_KEY)


# Embedding model config
EMBEDDING_MODEL = "models/text-embedding-004"
EMBEDDING_DIMS = 768  # text-embedding-004 outputs 768 dimensions


def embed_text(text: str) -> list[float]:
    """
    Embed text using Google's text-embedding-004 model.
    
    Args:
        text: Text to embed
        
    Returns:
        768-dimensional embedding vector
    """
    client = get_genai_client()
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text
    )
    return result.embeddings[0].values


class Memory:
    """
    Long-term memory system using Qdrant vector database.
    
    Enables Fido to:
    - Remember facts about owner (preferences, habits, relationships)
    - Store and retrieve daily activities
    - Build context over time
    - Search semantically (not just keyword matching)
    
    Collections:
    - fido_memory: General facts, preferences, people, places, events
    - daily_activities: Daily activity log (from background monitor)
    - conversations: Conversation history for semantic search
    
    Note: Smart home integration (hass_entities) handled separately via MQTT
    """
    
    def __init__(self):
        self.qdrant = get_qdrant_client()
    
    def store(
        self,
        text: str,
        collection: str,
        metadata: dict[str, Any] | None = None
    ) -> str:
        """
        Store a memory in vector database.
        
        Args:
            text: The memory text to store
            collection: Which collection (fido_memory, daily_activities, conversations)
            metadata: Additional data (category, timestamp, etc.)
        
        Returns:
            Memory ID (point ID as string)
        
        Example:
            memory.store(
                "Owner likes coffee black",
                "fido_memory",
                {"category": "preferences"}
            )
        """
        # Generate vector embedding
        vector = embed_text(text)
        
        # Create unique ID based on timestamp
        point_id = int(time.time() * 1000000) % (10 ** 9)
        
        # Store in Qdrant
        self.qdrant.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "text": text,
                        "timestamp": time.time(),
                        **(metadata or {})
                    }
                )
            ]
        )
        
        return str(point_id)
    
    def search(
        self,
        query: str,
        collection: str,
        limit: int = 5,
        score_threshold: float = 0.5
    ) -> list[dict[str, Any]]:
        """
        Search memories semantically.
        
        Args:
            query: What to search for (natural language)
            collection: Which collection to search
            limit: Max results to return
            score_threshold: Minimum similarity score (0-1)
        
        Returns:
            List of matching memories with scores
        
        Example:
            results = memory.search(
                "coffee preferences",
                "fido_memory",
                limit=3
            )
            # Returns: [{"text": "Owner likes coffee black", "score": 0.92, ...}]
        """
        # Generate query vector
        query_vector = embed_text(query)
        
        # Search using query_points (qdrant-client 1.16+)
        results = self.qdrant.query_points(
            collection_name=collection,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold
        )
        
        return [
            {
                "text": hit.payload.get("text") or hit.payload.get("content", ""),
                "score": hit.score,
                "metadata": {k: v for k, v in hit.payload.items() if k not in ("text", "content")}
            }
            for hit in results.points
        ]
    
    def get_by_timeframe(
        self,
        collection: str,
        days_ago: int | None = None,
        start_timestamp: float | None = None,
        end_timestamp: float | None = None,
        oldest_first: bool = True,
        limit: int = 100
    ) -> list[dict[str, Any]]:
        """
        Get memories from a specific time period.
        
        Flexible time filtering - use ONE of these approaches:
        1. days_ago: Get memories from the last N days (e.g., days_ago=7 for last week)
        2. start_timestamp/end_timestamp: Exact Unix timestamp range
        3. Neither: Returns most recent memories (no time filter)
        
        Args:
            collection: Which collection to query
            days_ago: Number of days to look back (e.g., 1=today, 7=last week, 30=last month)
            start_timestamp: Unix timestamp for range start (alternative to days_ago)
            end_timestamp: Unix timestamp for range end (defaults to now)
            oldest_first: If True, returns oldest first (chronological). If False, newest first.
            limit: Max results to return
        
        Returns:
            List of memories from that time period
        
        Examples:
            # Today's memories
            get_by_timeframe("daily_activities", days_ago=1)
            
            # Last week
            get_by_timeframe("fido_memory", days_ago=7)
            
            # Last month
            get_by_timeframe("conversations", days_ago=30)
        """
        from qdrant_client.models import Filter, FieldCondition, Range, OrderBy, Direction
        
        scroll_filter = None
        now = time.time()
        
        # Build time filter if any time parameter is provided
        if days_ago is not None:
            start_ts = now - (days_ago * 24 * 60 * 60)
            end_ts = now
            scroll_filter = Filter(
                must=[
                    FieldCondition(
                        key="timestamp",
                        range=Range(gte=start_ts, lte=end_ts)
                    )
                ]
            )
        elif start_timestamp is not None:
            end_ts = end_timestamp if end_timestamp else now
            scroll_filter = Filter(
                must=[
                    FieldCondition(
                        key="timestamp",
                        range=Range(gte=start_timestamp, lte=end_ts)
                    )
                ]
            )
        
        results = self.qdrant.scroll(
            collection_name=collection,
            scroll_filter=scroll_filter,
            limit=limit,
            with_vectors=False,
            order_by=OrderBy(key="timestamp", direction=Direction.ASC if oldest_first else Direction.DESC)
        )
        
        return [
            {
                "text": point.payload["text"],
                "metadata": point.payload
            }
            for point in results[0]  # results is tuple (points, next_offset)
        ]
    
    def delete_similar(
        self,
        query: str,
        collection: str,
        score_threshold: float = 0.7,
        limit: int = 3
    ) -> int:
        """
        Delete memories that are similar to the query.
        
        Useful for updating/replacing old information.
        
        Args:
            query: Text to find similar memories
            collection: Which collection
            score_threshold: Minimum similarity to delete (0-1)
            limit: Max memories to check
        
        Returns:
            Number of memories deleted
        
        Example:
            # Before storing "Aarav's favorite color is red"
            # Delete old "Aarav's favorite color is blue"
            deleted = memory.delete_similar(
                "Aarav's favorite color",
                "fido_memory",
                score_threshold=0.7
            )
        """
        # Search for similar memories
        query_vector = embed_text(query)
        
        results = self.qdrant.query_points(
            collection_name=collection,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold
        )
        
        # Delete each similar memory
        deleted_count = 0
        for hit in results.points:
            try:
                self.qdrant.delete(
                    collection_name=collection,
                    points_selector=[hit.id]
                )
                deleted_count += 1
            except Exception:
                pass  # Continue even if one deletion fails
        
        return deleted_count


@lru_cache(maxsize=1)
def get_memory() -> Memory:
    """Get global memory instance (singleton)"""
    return Memory()

