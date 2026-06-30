# backend/app/db/redis_pool.py
"""
Returns a Redis client, or None if Redis is unreachable at startup.
The HybridConversationStore is written to treat None as "operate in
MySQL-only mode" — this is intentional, not an error state.
"""
import redis
import os
import logging

logger = logging.getLogger(__name__)
_client = None
_attempted = False

def get_redis_client():
    global _client, _attempted
    if _attempted:
        return _client
    _attempted = True
    try:
        _client = redis.from_url(
            os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
            decode_responses=True,
            socket_connect_timeout=1,  # fail fast on connect
            socket_timeout=0.5,        # fail fast on reads/writes to prevent UI lag
        )
        _client.ping()
        logger.info("Redis cache layer connected successfully")
    except Exception as e:
        logger.warning(f"Redis unavailable at startup, operating in MySQL-only mode: {e}")
        _client = None
    return _client
