from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import List
import uuid

@dataclass
class Message:
    role: str           # "user" | "assistant"
    content: str
    sql: str = ""
    row_count: int = 0
    domain: str = "porter"
    timestamp: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Conversation:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default"
    title: str = "New Conversation"
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)


class ConversationStore:
    """In-memory store. Phase 6 replaces with SQLite/Postgres."""
    _store: dict = defaultdict(dict)  # {user_id: {conv_id: Conversation}}

    def create(self, user_id: str, first_question: str) -> Conversation:
        conv = Conversation(
            user_id=user_id,
            title=first_question[:60] + ("..." if len(first_question) > 60 else ""),
        )
        self._store[user_id][conv.id] = conv
        return conv

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        if conv_id in self._store[user_id]:
            self._store[user_id][conv_id].messages.append(msg)

    def get_messages(self, user_id: str, conv_id: str) -> List[Message]:
        conv = self._store[user_id].get(conv_id)
        return conv.messages if conv else []

    def list_conversations(self, user_id: str) -> List[Conversation]:
        convs = list(self._store[user_id].values())
        return sorted(convs, key=lambda c: c.created_at, reverse=True)

    def delete(self, user_id: str, conv_id: str) -> bool:
        if conv_id in self._store[user_id]:
            del self._store[user_id][conv_id]
            return True
        return False

    def get_recent_context(self, user_id: str, conv_id: str, max_turns: int = 3) -> str:
        """Returns last N Q&A pairs as a string for LLM context."""
        messages = self.get_messages(user_id, conv_id)
        recent = messages[-(max_turns * 2):]
        return "\n".join(
            f"{m.role.upper()}: {m.content[:200]}" for m in recent
        )


_store = ConversationStore()
