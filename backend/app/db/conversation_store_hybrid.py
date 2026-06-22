# backend/app/db/conversation_store_hybrid.py
"""
Hybrid store: MySQL is the permanent source of truth. Redis is a
24-hour cache layer for faster reads on recent/active conversations.
MySQL writes ALWAYS happen and ALWAYS succeed-or-raise; Redis writes
are best-effort and NEVER block or fail the overall operation.
"""
import json
import logging
from datetime import datetime
from typing import List, Optional

from backend.app.db.conversation_store import Message, Conversation
from backend.app.db.conversation_store_mysql import MySQLConversationStore, _sanitize_for_storage
from backend.app.db.redis_pool import get_redis_client

logger = logging.getLogger(__name__)
CACHE_TTL_SECONDS = 86400  # 24 hours

class HybridConversationStore:

    def __init__(self):
        self._mysql = MySQLConversationStore()   # source of truth
        self._redis = get_redis_client()           # may be None if Redis unavailable

    # ---- WRITE PATH: MySQL always, Redis best-effort ----

    def create(self, user_id: str, first_question: str, conv_id: Optional[str] = None) -> Conversation:
        conv = self._mysql.create(user_id, first_question, conv_id)  # MySQL FIRST, always
        self._cache_write_meta(conv)                                   # Redis best-effort
        return conv

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        self._mysql.add_message(user_id, conv_id, msg)                # MySQL FIRST, always
        self._cache_append_message(conv_id, msg)                       # Redis best-effort

    def _cache_write_meta(self, conv: Conversation) -> None:
        if self._redis is None:
            return
        try:
            meta_key = f"conv:{conv.id}:meta"
            self._redis.hset(meta_key, mapping={
                "user_id": conv.user_id, "title": conv.title,
                "created_at": conv.created_at.isoformat(),
            })
            self._redis.expire(meta_key, CACHE_TTL_SECONDS)
            self._redis.zadd(f"user:{conv.user_id}:recent", {conv.id: conv.created_at.timestamp()})
            self._redis.expire(f"user:{conv.user_id}:recent", CACHE_TTL_SECONDS)
        except Exception as e:
            logger.warning(f"Redis cache write failed (non-fatal): {e}")

    def _cache_append_message(self, conv_id: str, msg: Message) -> None:
        if self._redis is None:
            return
        try:
            key = f"conv:{conv_id}:messages"
            self._redis.rpush(key, self._message_to_json(msg))
            self._redis.expire(key, CACHE_TTL_SECONDS)
        except Exception as e:
            logger.warning(f"Redis cache append failed (non-fatal): {e}")

    # ---- READ PATH: Redis first (fast path), MySQL fallback (always correct) ----

    def get_messages(self, user_id: str, conv_id: str) -> List[Message]:
        if self._redis is not None:
            try:
                key = f"conv:{conv_id}:messages"
                if self._redis.exists(key):
                    raw = self._redis.lrange(key, 0, -1)
                    return [self._json_to_message(r) for r in raw]
            except Exception as e:
                logger.warning(f"Redis read failed, falling back to MySQL: {e}")

        # Cache miss
        messages = self._mysql.get_messages(user_id, conv_id)

        # Optional: warm the cache on a miss
        if self._redis is not None and messages:
            try:
                key = f"conv:{conv_id}:messages"
                pipe = self._redis.pipeline()
                for m in messages:
                    pipe.rpush(key, self._message_to_json(m))
                pipe.expire(key, CACHE_TTL_SECONDS)
                pipe.execute()
            except Exception as e:
                logger.warning(f"Redis cache warm failed (non-fatal): {e}")

        return messages

    def cleanup_old_conversations(self, user_id: str, days: int = 30):
        # We only really do this in MySQL, Redis is ephemeral/LRU anyway
        self._mysql.cleanup_old_conversations(user_id, days)

    def get_user_recommendations(self, user_id: str) -> list[str]:
        # Pass-through to MySQL store where the complex SQL grouping lives
        return self._mysql.get_user_recommendations(user_id)

    def list_conversations(self, user_id: str) -> List[Conversation]:
        return self._mysql.list_conversations(user_id)

    def delete(self, user_id: str, conv_id: str) -> bool:
        result = self._mysql.delete(user_id, conv_id)
        if self._redis is not None:
            try:
                self._redis.delete(f"conv:{conv_id}:meta", f"conv:{conv_id}:messages")
                self._redis.zrem(f"user:{user_id}:recent", conv_id)
            except Exception as e:
                logger.warning(f"Redis cache cleanup on delete failed (non-fatal): {e}")
        return result

    def get_recent_context(self, user_id: str, conv_id: str, max_turns: int = 3) -> str:
        if self._redis is not None:
            try:
                key = f"conv:{conv_id}:messages"
                if self._redis.exists(key):
                    raw = self._redis.lrange(key, -(max_turns * 2), -1)
                    messages = [self._json_to_message(r) for r in raw]
                    lines = []
                    for m in messages:
                        lines.append(f"{m.role.upper()}: {m.content[:200]}")
                        if m.role == "assistant" and getattr(m, "domain", None):
                            lines.append(f"  [scope: domain={m.domain}, facility={getattr(m, 'facility_id', 'not specified')}]")
                    return "\n".join(lines)
            except Exception as e:
                logger.warning(f"Redis recent-context read failed, falling back to MySQL: {e}")
        return self._mysql.get_recent_context(user_id, conv_id, max_turns)

    def session_exists(self, user_id: str, conv_id: str) -> bool:
        if self._redis is not None:
            try:
                if self._redis.exists(f"conv:{conv_id}:meta"):
                    return True
            except Exception as e:
                logger.warning(f"Redis exists-check failed, falling back to MySQL: {e}")
        return self._mysql.session_exists(user_id, conv_id)

    def search_past_conversations(self, user_id: str, search_terms: list[str], exclude_conv_id: str | None = None, max_results: int = 3) -> list[dict]:
        return self._mysql.search_past_conversations(user_id, search_terms, exclude_conv_id, max_results)

    @staticmethod
    def _message_to_json(msg: Message) -> str:
        return json.dumps(msg.to_dict(), default=str)

    @staticmethod
    def _json_to_message(raw: str) -> Message:
        return Message.from_dict(json.loads(raw))
