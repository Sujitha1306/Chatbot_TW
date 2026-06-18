from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import List
import uuid
import json
import os

@dataclass
class Message:
    role: str           # "user" | "assistant"
    content: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    sql: str = ""
    row_count: int = 0
    domain: str = "porter"
    facility_id: str | None = None
    data: list = field(default_factory=list)
    chartSpec: dict = field(default_factory=dict)
    displaySections: list = field(default_factory=list)
    crossConversationRefs: list = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self):
        return {
            "role": self.role,
            "content": self.content,
            "id": self.id,
            "sql": self.sql,
            "row_count": self.row_count,
            "domain": self.domain,
            "facility_id": self.facility_id,
            "data": self.data,
            "chartSpec": self.chartSpec,
            "displaySections": self.displaySections,
            "crossConversationRefs": self.crossConversationRefs,
            "timestamp": self.timestamp.isoformat()
        }

    @classmethod
    def from_dict(cls, d):
        m = cls(
            role=d.get("role", "user"),
            content=d.get("content", ""),
            id=d.get("id", str(uuid.uuid4())),
            sql=d.get("sql", ""),
            row_count=d.get("row_count", 0),
            domain=d.get("domain", "porter"),
            facility_id=d.get("facility_id"),
            data=d.get("data", []),
            chartSpec=d.get("chartSpec", {}),
            displaySections=d.get("displaySections", []),
            crossConversationRefs=d.get("crossConversationRefs", []),
        )
        if "timestamp" in d:
            try:
                m.timestamp = datetime.fromisoformat(d["timestamp"])
            except:
                pass
        return m

@dataclass
class Conversation:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default"
    title: str = "New Conversation"
    messages: List[Message] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, d):
        c = cls(
            id=d.get("id", str(uuid.uuid4())),
            user_id=d.get("user_id", "default"),
            title=d.get("title", "New Conversation"),
            messages=[Message.from_dict(m) for m in d.get("messages", [])],
        )
        if "created_at" in d:
            try:
                c.created_at = datetime.fromisoformat(d["created_at"])
            except:
                pass
        return c

class ConversationStore:
    """Persistent file store to survive reloads."""
    def __init__(self, file_path=".data/conversations.json"):
        self.file_path = file_path
        self._store = defaultdict(dict)
        self._load()
        
    def _load(self):
        if not os.path.exists(os.path.dirname(self.file_path)):
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r') as f:
                    data = json.load(f)
                    for user_id, convs in data.items():
                        for conv_id, conv_data in convs.items():
                            self._store[user_id][conv_id] = Conversation.from_dict(conv_data)
            except Exception as e:
                print(f"Failed to load conversations: {e}")

    def _save(self):
        data = {}
        for user_id, convs in self._store.items():
            data[user_id] = {conv_id: conv.to_dict() for conv_id, conv in convs.items()}
            
        with open(self.file_path, 'w') as f:
            json.dump(data, f)

    def create(self, user_id: str, first_question: str, conv_id: str = None) -> Conversation:
        conv = Conversation(
            id=conv_id or str(uuid.uuid4()),
            user_id=user_id,
            title=first_question[:60] + ("..." if len(first_question) > 60 else ""),
        )
        self._store[user_id][conv.id] = conv
        self._save()
        return conv

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        if conv_id in self._store[user_id]:
            self._store[user_id][conv_id].messages.append(msg)
            self._save()

    def get_messages(self, user_id: str, conv_id: str) -> List[Message]:
        conv = self._store[user_id].get(conv_id)
        return conv.messages if conv else []

    def list_conversations(self, user_id: str) -> List[Conversation]:
        convs = list(self._store[user_id].values())
        return sorted(convs, key=lambda c: c.created_at, reverse=True)

    def delete(self, user_id: str, conv_id: str) -> bool:
        if conv_id in self._store[user_id]:
            del self._store[user_id][conv_id]
            self._save()
            return True
        return False

    def search_past_conversations(
        self,
        user_id: str,
        search_terms: list[str],
        exclude_conv_id: str | None = None,
        max_results: int = 3,
    ) -> list[dict]:
        all_convs = self.list_conversations(user_id)
        matches = []

        for conv in all_convs:
            if conv.id == exclude_conv_id:
                continue

            searchable_text = conv.title.lower() + " " + " ".join(m.content.lower() for m in conv.messages)
            match_count = sum(1 for term in search_terms if term.lower() in searchable_text)
            if match_count == 0:
                continue

            relevant_exchanges = []
            for i, msg in enumerate(conv.messages):
                if any(term.lower() in msg.content.lower() for term in search_terms):
                    start = max(0, i - 1)
                    end = min(len(conv.messages), i + 2)
                    for j in range(start, end):
                        if conv.messages[j] not in [e for e in relevant_exchanges]:
                            relevant_exchanges.append(conv.messages[j])

            seen_ids = set()
            deduped = []
            for m in relevant_exchanges:
                if id(m) not in seen_ids:
                    seen_ids.add(id(m))
                    deduped.append(m)

            matches.append({
                "conversation_id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at,
                "match_count": match_count,
                "relevant_messages": [
                    {"role": m.role, "content": m.content[:500]}
                    for m in deduped
                ][:6],
            })

        matches.sort(key=lambda m: m["match_count"], reverse=True)
        return matches[:max_results]

    def get_recent_context(self, user_id: str, conv_id: str, max_turns: int = 3) -> str:
        messages = self.get_messages(user_id, conv_id)
        recent = messages[-(max_turns * 2):]

        lines = []
        for m in recent:
            lines.append(f"{m.role.upper()}: {m.content[:200]}")
            if m.role == "assistant" and getattr(m, "domain", None):
                lines.append(f"  [scope: domain={m.domain}, facility={getattr(m, 'facility_id', 'not specified')}]")

        return "\n".join(lines)


_store = ConversationStore()
