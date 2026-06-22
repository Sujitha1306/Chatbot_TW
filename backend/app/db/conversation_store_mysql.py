import json
import logging
import uuid
from typing import List, Optional
from datetime import datetime

from backend.app.db.conversation_store import Conversation, Message
from backend.app.db.mysql_pool import get_mysql_connection

logger = logging.getLogger(__name__)

def _sanitize_for_storage(obj):
    """Sanitize lists/dicts for JSON storage if needed."""
    if obj is None:
        return None
    try:
        return json.dumps(obj, default=str)
    except Exception:
        return "{}"

class MySQLConversationStore:
    def create(self, user_id: str, first_question: str, conv_id: Optional[str] = None) -> Conversation:
        conv_id = conv_id or str(uuid.uuid4())
        title = first_question[:60] + ("..." if len(first_question) > 60 else "")
        created_at = datetime.utcnow()
        
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (id, user_id, title, created_at) VALUES (%s, %s, %s, %s)",
                (conv_id, user_id, title, created_at)
            )
            conn.commit()
        finally:
            conn.close()
            
        return Conversation(id=conv_id, user_id=user_id, title=title, created_at=created_at)

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            
            # Pack extra fields into data_json to fit provisional schema
            packed_data = {
                "data": msg.data,
                "facility_id": msg.facility_id,
                "filters": msg.filters,
                "displaySections": msg.displaySections,
                "crossConversationRefs": msg.crossConversationRefs
            }
            
            cursor.execute(
                """
                INSERT INTO messages 
                (id, conversation_id, role, content, sql_text, row_count, domain, data_json, chart_spec_json, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    msg.id, conv_id, msg.role, msg.content, msg.sql, msg.row_count, msg.domain,
                    _sanitize_for_storage(packed_data),
                    _sanitize_for_storage(msg.chartSpec),
                    msg.timestamp
                )
            )
            conn.commit()
        finally:
            conn.close()

    def get_messages(self, user_id: str, conv_id: str) -> List[Message]:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT id, role, content, sql_text, row_count, domain, data_json, chart_spec_json, created_at
                FROM messages
                WHERE conversation_id = %s
                ORDER BY created_at ASC
                """,
                (conv_id,)
            )
            rows = cursor.fetchall()
            
            messages = []
            for row in rows:
                packed_data = {}
                if row.get('data_json'):
                    try:
                        packed_data = json.loads(row['data_json'])
                    except Exception:
                        pass
                
                chart_spec = {}
                if row.get('chart_spec_json'):
                    try:
                        chart_spec = json.loads(row['chart_spec_json'])
                    except Exception:
                        pass
                        
                m = Message(
                    id=row['id'],
                    role=row['role'],
                    content=row['content'],
                    sql=row['sql_text'] or "",
                    row_count=row['row_count'] or 0,
                    domain=row['domain'] or "porter",
                    data=packed_data.get('data', []),
                    facility_id=packed_data.get('facility_id'),
                    filters=packed_data.get('filters'),
                    displaySections=packed_data.get('displaySections', []),
                    crossConversationRefs=packed_data.get('crossConversationRefs', []),
                    chartSpec=chart_spec,
                    timestamp=row['created_at']
                )
                messages.append(m)
            return messages
        finally:
            conn.close()

    def list_conversations(self, user_id: str) -> List[Conversation]:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                """
                SELECT id, user_id, title, created_at
                FROM conversations
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,)
            )
            rows = cursor.fetchall()
            
            convs = []
            for row in rows:
                c = Conversation(
                    id=row['id'],
                    user_id=row['user_id'],
                    title=row['title'],
                    created_at=row['created_at']
                )
                convs.append(c)
            return convs
        finally:
            conn.close()

    def delete(self, user_id: str, conv_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM conversations WHERE id = %s AND user_id = %s", (conv_id, user_id))
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted
        finally:
            conn.close()

    def get_user_recommendations(self, user_id: str) -> List[str]:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            # Group by lower-case, trimmed content to avoid minor variations
            cursor.execute(
                """
                SELECT MIN(m.content) as original_content, COUNT(*) as frequency
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.user_id = %s AND m.role = 'user'
                GROUP BY LOWER(TRIM(REPLACE(REPLACE(m.content, '?', ''), '.', '')))
                HAVING COUNT(*) >= 3
                ORDER BY frequency DESC
                LIMIT 5
                """,
                (user_id,)
            )
            rows = cursor.fetchall()
            return [row['original_content'] for row in rows]
        finally:
            conn.close()

    def get_recent_context(self, user_id: str, conv_id: str, max_turns: int = 3) -> str:
        messages = self.get_messages(user_id, conv_id)
        recent = messages[-(max_turns * 2):]

        lines = []
        for m in recent:
            lines.append(f"{m.role.upper()}: {m.content[:200]}")
            if m.role == "assistant" and getattr(m, "domain", None):
                lines.append(f"  [scope: domain={m.domain}, facility={getattr(m, 'facility_id', 'not specified')}]")

        return "\n".join(lines)

    def session_exists(self, user_id: str, conv_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM conversations WHERE id = %s AND user_id = %s LIMIT 1", (conv_id, user_id))
            return cursor.fetchone() is not None
        finally:
            conn.close()

    def search_past_conversations(self, user_id: str, search_terms: list[str], exclude_conv_id: str | None = None, max_results: int = 3) -> list[dict]:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            # Use MATCH() AGAINST() for full text search, combining terms
            search_query = " ".join([f"+{t}" for t in search_terms])
            
            exclude_clause = "AND c.id != %s" if exclude_conv_id else ""
            params = [user_id, search_query]
            if exclude_conv_id:
                params.append(exclude_conv_id)
                
            # Note: This is a basic mapping of the search logic using the FULLTEXT index. 
            # In a real scenario, we might want to group by conversation to match the JSON search logic more closely,
            # but the schema provides FULLTEXT on message content.
            
            # Simple implementation that fetches all conversations for the user and filters them in python
            # just like the JSON store did, to ensure exact same behavior.
            cursor.execute(
                f"""
                SELECT c.id, c.title, c.created_at, m.role, m.content, m.id as msg_id
                FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                WHERE c.user_id = %s {exclude_clause}
                ORDER BY c.created_at DESC
                """,
                tuple(params if exclude_conv_id else [user_id])
            )
            rows = cursor.fetchall()
            
            # Group by conversation
            conv_map = {}
            for row in rows:
                cid = row['id']
                if cid not in conv_map:
                    conv_map[cid] = {
                        "id": cid,
                        "title": row['title'],
                        "created_at": row['created_at'],
                        "messages": []
                    }
                if row['content']:
                    # Reconstruct a mock message for searching
                    conv_map[cid]["messages"].append(Message(
                        role=row['role'],
                        content=row['content'],
                        id=row['msg_id']
                    ))

            # Apply same Python-side search logic as JSON store for perfect compatibility
            matches = []
            for conv_id, conv in conv_map.items():
                searchable_text = conv["title"].lower() + " " + " ".join(m.content.lower() for m in conv["messages"])
                match_count = sum(1 for term in search_terms if term.lower() in searchable_text)
                if match_count == 0:
                    continue

                relevant_exchanges = []
                for i, msg in enumerate(conv["messages"]):
                    if any(term.lower() in msg.content.lower() for term in search_terms):
                        start = max(0, i - 1)
                        end = min(len(conv["messages"]), i + 2)
                        for j in range(start, end):
                            if conv["messages"][j] not in [e for e in relevant_exchanges]:
                                relevant_exchanges.append(conv["messages"][j])

                seen_ids = set()
                deduped = []
                for m in relevant_exchanges:
                    if id(m) not in seen_ids:
                        seen_ids.add(id(m))
                        deduped.append(m)

                matches.append({
                    "conversation_id": conv["id"],
                    "title": conv["title"],
                    "created_at": conv["created_at"],
                    "match_count": match_count,
                    "relevant_messages": [
                        {"role": m.role, "content": m.content[:500]}
                        for m in deduped
                    ][:6],
                })

            matches.sort(key=lambda m: m["match_count"], reverse=True)
            return matches[:max_results]
        finally:
            conn.close()
