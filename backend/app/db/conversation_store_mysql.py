import json
import logging
import uuid
import threading
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
    _schema_checked = False
    _recs_cache = {}  # (user_id, facility_id) -> (timestamp, recs_list)
    _schema_lock = threading.Lock()

    def __init__(self):
        if not MySQLConversationStore._schema_checked:
            threading.Thread(target=self._ensure_schema, daemon=True).start()

    def _ensure_schema(self):
        if MySQLConversationStore._schema_checked:
            return
        with MySQLConversationStore._schema_lock:
            if MySQLConversationStore._schema_checked:
                return
            try:
                conn = get_mysql_connection()
                cursor = conn.cursor(buffered=True)
                try:
                    cursor.execute("SHOW COLUMNS FROM conversations LIKE 'facility_id'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE conversations ADD COLUMN facility_id VARCHAR(32) NULL")
                except Exception:
                    pass
                try:
                    cursor.execute("SHOW COLUMNS FROM messages LIKE 'facility_id'")
                    if not cursor.fetchone():
                        cursor.execute("ALTER TABLE messages ADD COLUMN facility_id VARCHAR(32) NULL")
                except Exception:
                    pass
                try:
                    cursor.execute("SHOW INDEX FROM conversations WHERE Key_name = 'idx_user_fac_created'")
                    if not cursor.fetchone():
                        cursor.execute("CREATE INDEX idx_user_fac_created ON conversations (user_id, facility_id, created_at)")
                except Exception:
                    pass
                try:
                    cursor.execute("SHOW INDEX FROM messages WHERE Key_name = 'idx_user_fac_created'")
                    if not cursor.fetchone():
                        cursor.execute("CREATE INDEX idx_user_fac_created ON messages (user_id, facility_id, created_at)")
                except Exception:
                    pass
                conn.commit()
                conn.close()
            except Exception as e:
                logger.warning(f"Could not check/alter schema for facility_id: {e}")
            finally:
                MySQLConversationStore._schema_checked = True

    def create(self, user_id: str, first_question: str, conv_id: Optional[str] = None, facility_id: Optional[str] = None) -> Conversation:
        self._ensure_schema()
        conv_id = conv_id or str(uuid.uuid4())
        title = first_question[:60] + ("..." if len(first_question) > 60 else "")
        created_at = datetime.utcnow()
        fac_id = facility_id or "0459"
        
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (id, user_id, title, created_at, facility_id) VALUES (%s, %s, %s, %s, %s)",
                (conv_id, user_id, title, created_at, fac_id)
            )
            conn.commit()
        finally:
            conn.close()
            
        return Conversation(id=conv_id, user_id=user_id, title=title, created_at=created_at, facility_id=fac_id)

    def add_message(self, user_id: str, conv_id: str, msg: Message) -> None:
        self._ensure_schema()
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
                (id, conversation_id, role, content, sql_text, row_count, domain, data_json, chart_spec_json, tokens_used, created_at, facility_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    msg.id, conv_id, msg.role, msg.content, msg.sql, msg.row_count, msg.domain,
                    _sanitize_for_storage(packed_data),
                    _sanitize_for_storage(msg.chartSpec),
                    msg.tokens_used,
                    msg.timestamp,
                    msg.facility_id or "0459"
                )
            )
            
            if msg.tokens_used > 0:
                cursor.execute(
                    "UPDATE conversations SET total_tokens_used = total_tokens_used + %s WHERE id = %s",
                    (msg.tokens_used, conv_id)
                )
            conn.commit()
        finally:
            conn.close()

    def get_messages(self, user_id: str, conv_id: str, limit: int = None, offset: int = 0, facility_id: Optional[str] = None) -> List[Message]:
        self._ensure_schema()
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            fac_clause = ""
            params = [conv_id, user_id]
            if facility_id and str(facility_id).strip() != "":
                fac_clause = " AND c.facility_id = %s"
                params.append(str(facility_id).strip())

            if limit is not None:
                params.extend([limit, offset])
                cursor.execute(
                    f"""
                    SELECT m.id, m.role, m.content, m.sql_text, m.row_count, m.domain, m.data_json, m.chart_spec_json, m.tokens_used, m.created_at
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE m.conversation_id = %s AND c.user_id = %s{fac_clause}
                    ORDER BY m.created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    tuple(params)
                )
                rows = cursor.fetchall()
                rows.reverse()
            else:
                cursor.execute(
                    f"""
                    SELECT m.id, m.role, m.content, m.sql_text, m.row_count, m.domain, m.data_json, m.chart_spec_json, m.tokens_used, m.created_at
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE m.conversation_id = %s AND c.user_id = %s{fac_clause}
                    ORDER BY m.created_at ASC
                    """,
                    tuple(params)
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
                    tokens_used=row.get('tokens_used', 0),
                    timestamp=row['created_at']
                )
                messages.append(m)
            return messages
        finally:
            conn.close()

    def list_conversations(self, user_id: str, limit: int = 10, offset: int = 0, facility_id: Optional[str] = None) -> List[Conversation]:
        self._ensure_schema()
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            fac_clause = ""
            params = [user_id]
            eff_fac = facility_id if (facility_id and str(facility_id).strip() != "") else "0459"
            fac_clause = " AND facility_id = %s"
            params.append(eff_fac)
            
            params.extend([limit, offset])
            cursor.execute(
                f"""
                SELECT id, user_id, title, is_favorite, total_tokens_used, created_at, facility_id
                FROM conversations
                WHERE user_id = %s{fac_clause}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                tuple(params)
            )
            rows = cursor.fetchall()
            
            convs = []
            for row in rows:
                c = Conversation(
                    id=row['id'],
                    user_id=row['user_id'],
                    title=row['title'],
                    is_favorite=bool(row.get('is_favorite', False)),
                    total_tokens_used=row.get('total_tokens_used', 0),
                    created_at=row['created_at'],
                    facility_id=row.get('facility_id')
                )
                convs.append(c)
            return convs
        finally:
            conn.close()

    def toggle_favorite(self, user_id: str, conv_id: str, is_favorite: bool) -> bool:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE conversations SET is_favorite = %s WHERE id = %s AND user_id = %s", (is_favorite, conv_id, user_id))
            toggled = cursor.rowcount > 0
            conn.commit()
            return toggled
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

    def truncate(self, user_id: str, conv_id: str, message_id: str) -> bool:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            # Verify conversation belongs to user
            cursor.execute("SELECT 1 FROM conversations WHERE id = %s AND user_id = %s", (conv_id, user_id))
            if not cursor.fetchone():
                return False
                
            # Get created_at of the target message
            cursor.execute("SELECT created_at FROM messages WHERE id = %s AND conversation_id = %s", (message_id, conv_id))
            row = cursor.fetchone()
            if not row:
                return False
                
            # Delete messages created on or after this message
            cursor.execute(
                "DELETE FROM messages WHERE conversation_id = %s AND created_at >= %s", 
                (conv_id, row['created_at'])
            )
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted
        finally:
            conn.close()

    def rename(self, user_id: str, conv_id: str, new_title: str) -> bool:
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE conversations SET title = %s WHERE id = %s AND user_id = %s", (new_title, conv_id, user_id))
            renamed = cursor.rowcount > 0
            conn.commit()
            return renamed
        finally:
            conn.close()

    def get_user_recommendations(self, user_id: str, facility_id: Optional[str] = None) -> List[str]:
        self._ensure_schema()
        eff_fac = facility_id if (facility_id and str(facility_id).strip() != "") else "0459"
        cache_key = (user_id, eff_fac)
        now_ts = datetime.utcnow().timestamp()
        if cache_key in MySQLConversationStore._recs_cache:
            cached_ts, cached_list = MySQLConversationStore._recs_cache[cache_key]
            if now_ts - cached_ts < 300:  # 5-minute TTL
                return cached_list

        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            params = [user_id, eff_fac]
            cursor.execute(
                """
                SELECT MIN(m.content) as original_content, COUNT(*) as frequency
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.user_id = %s AND c.facility_id = %s AND m.role = 'user'
                  AND c.created_at >= NOW() - INTERVAL 30 DAY
                GROUP BY LOWER(TRIM(REPLACE(REPLACE(m.content, '?', ''), '.', '')))
                HAVING COUNT(*) >= 2
                ORDER BY frequency DESC
                LIMIT 5
                """,
                tuple(params)
            )
            rows = cursor.fetchall()
            recs = [row['original_content'] for row in rows]
            MySQLConversationStore._recs_cache[cache_key] = (now_ts, recs)
            return recs
        finally:
            conn.close()

    def get_recent_context(self, user_id: str, conv_id: str, max_turns: int = 3, facility_id: Optional[str] = None) -> str:
        messages = self.get_messages(user_id, conv_id, facility_id=facility_id)
        recent = messages[-(max_turns * 2):]

        lines = []
        for m in recent:
            lines.append(f"{m.role.upper()}: {m.content[:200]}")
            if m.role == "assistant" and getattr(m, "domain", None):
                lines.append(f"  [scope: domain={m.domain}, facility={getattr(m, 'facility_id', 'not specified')}]")

        return "\n".join(lines)

    def session_exists(self, user_id: str, conv_id: str, facility_id: Optional[str] = None) -> bool:
        self._ensure_schema()
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor()
            fac_clause = ""
            params = [conv_id, user_id]
            eff_fac = facility_id if (facility_id and str(facility_id).strip() != "") else "0459"
            fac_clause = " AND facility_id = %s"
            params.append(eff_fac)
            cursor.execute(f"SELECT 1 FROM conversations WHERE id = %s AND user_id = %s{fac_clause} LIMIT 1", tuple(params))
            return cursor.fetchone() is not None
        finally:
            conn.close()

    def search_past_conversations(self, user_id: str, search_terms: list[str], exclude_conv_id: str | None = None, max_results: int = 3, facility_id: Optional[str] = None) -> list[dict]:
        self._ensure_schema()
        conn = get_mysql_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            # Use MATCH() AGAINST() for full text search, combining terms
            search_query = " ".join([f"+{t}" for t in search_terms])
            
            exclude_clause = "AND c.id != %s" if exclude_conv_id else ""
            params = [user_id]
            if exclude_conv_id:
                params.append(exclude_conv_id)
                
            fac_clause = ""
            eff_fac = facility_id if (facility_id and str(facility_id).strip() != "") else "0459"
            fac_clause = " AND c.facility_id = %s"
            params.append(eff_fac)
                
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
                WHERE c.user_id = %s {exclude_clause}{fac_clause}
                ORDER BY c.created_at DESC
                LIMIT 200
                """,
                tuple(params)
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
