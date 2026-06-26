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
        try:
            conv = self._mysql.create(user_id, first_question, conv_id)  # MySQL FIRST, always
        except Exception as e:
            logger.warning(f"Failed to create conversation in MySQL (VPN lag?), relying on Redis: {e}")
            # Create a fake conversation object to store in Redis
            from datetime import datetime, timezone
            import uuid
            conv = Conversation(
                id=conv_id or str(uuid.uuid4()),
                user_id=user_id,
                title=first_question[:50],
                created_at=datetime.now(timezone.utc)
            )
        self._cache_write_meta(conv)                                   # Redis best-effort
        return conv

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        try:
            self._mysql.add_message(user_id, conv_id, msg)                # MySQL FIRST, always
        except Exception as e:
            logger.warning(f"Failed to add message to MySQL (VPN lag?), relying on Redis: {e}")
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
        try:
            messages = self._mysql.get_messages(user_id, conv_id)
        except Exception as e:
            logger.warning(f"Failed to get messages from MySQL (VPN lag?): {e}")
            return []

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
        try:
            self._mysql.cleanup_old_conversations(user_id, days)
        except Exception as e:
            logger.warning(f"Failed to cleanup conversations in MySQL (VPN lag?): {e}")

    def get_user_recommendations(self, user_id: str) -> list[str]:
        # Pass-through to MySQL store where the complex SQL grouping lives
        try:
            return self._mysql.get_user_recommendations(user_id)
        except Exception as e:
            logger.warning(f"Failed to get recommendations from MySQL (VPN lag?): {e}")
            return []

    def list_conversations(self, user_id: str) -> List[Conversation]:
        try:
            return self._mysql.list_conversations(user_id)
        except Exception as e:
            logger.warning(f"Failed to list conversations from MySQL (VPN lag?), falling back to Redis: {e}")
            if self._redis is None:
                return []
            try:
                # Fetch recent conversation IDs from Redis
                conv_ids = self._redis.zrevrange(f"user:{user_id}:recent", 0, -1)
                conversations = []
                for cid in conv_ids:
                    cid_str = cid.decode('utf-8') if isinstance(cid, bytes) else cid
                    meta = self._redis.hgetall(f"conv:{cid_str}:meta")
                    if meta:
                        from datetime import datetime
                        # Convert bytes to strings if necessary
                        title = meta.get(b'title') or meta.get('title', 'New Chat')
                        if isinstance(title, bytes): title = title.decode('utf-8')
                        created_str = meta.get(b'created_at') or meta.get('created_at')
                        if isinstance(created_str, bytes): created_str = created_str.decode('utf-8')
                        created_at = datetime.fromisoformat(created_str) if created_str else datetime.utcnow()
                        conversations.append(Conversation(id=cid_str, user_id=user_id, title=title, created_at=created_at))
                return conversations
            except Exception as redis_e:
                logger.warning(f"Redis list_conversations fallback failed: {redis_e}")
                return []

    def delete(self, user_id: str, conv_id: str) -> bool:
        try:
            result = self._mysql.delete(user_id, conv_id)
        except Exception as e:
            logger.warning(f"Failed to delete conversation from MySQL (VPN lag?): {e}")
            result = True
        if self._redis is not None:
            try:
                self._redis.delete(f"conv:{conv_id}:meta", f"conv:{conv_id}:messages")
                self._redis.zrem(f"user:{user_id}:recent", conv_id)
            except Exception as e:
                logger.warning(f"Redis cache cleanup on delete failed (non-fatal): {e}")
        return result

    def truncate(self, user_id: str, conv_id: str, message_id: str) -> bool:
        try:
            result = self._mysql.truncate(user_id, conv_id, message_id)
        except Exception as e:
            logger.warning(f"Failed to truncate conversation in MySQL (VPN lag?): {e}")
            result = True
        if self._redis is not None and result:
            try:
                # Easiest way to handle cache invalidation is to delete the messages list
                # It will be repopulated from MySQL on next read
                self._redis.delete(f"conv:{conv_id}:messages")
            except Exception as e:
                logger.warning(f"Redis cache cleanup on truncate failed (non-fatal): {e}")
        return result

    def rename(self, user_id: str, conv_id: str, new_title: str) -> bool:
        try:
            result = self._mysql.rename(user_id, conv_id, new_title)
        except Exception as e:
            logger.warning(f"Failed to rename conversation in MySQL (VPN lag?): {e}")
            result = True
        if self._redis is not None and result:
            try:
                # Update title in redis meta hash
                self._redis.hset(f"conv:{conv_id}:meta", "title", new_title)
            except Exception as e:
                logger.warning(f"Redis cache update on rename failed (non-fatal): {e}")
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
        try:
            return self._mysql.get_recent_context(user_id, conv_id, max_turns)
        except Exception as e:
            logger.warning(f"Failed to get recent context from MySQL (VPN lag?): {e}")
            return ""

    def session_exists(self, user_id: str, conv_id: str) -> bool:
        if self._redis is not None:
            try:
                if self._redis.exists(f"conv:{conv_id}:meta"):
                    return True
            except Exception as e:
                logger.warning(f"Redis exists-check failed, falling back to MySQL: {e}")
        try:
            return self._mysql.session_exists(user_id, conv_id)
        except Exception as e:
            logger.warning(f"Failed to check session existence in MySQL (VPN lag?): {e}")
            return False

    def search_past_conversations(self, user_id: str, search_terms: list[str], exclude_conv_id: str | None = None, max_results: int = 3) -> list[dict]:
        try:
            return self._mysql.search_past_conversations(user_id, search_terms, exclude_conv_id, max_results)
        except Exception as e:
            logger.warning(f"Failed to search past conversations in MySQL (VPN lag?): {e}")
            return []

    @staticmethod
    def _message_to_json(msg: Message) -> str:
        return json.dumps(msg.to_dict(), default=str)

    @staticmethod
    def _json_to_message(raw: str) -> Message:
        return Message.from_dict(json.loads(raw))
