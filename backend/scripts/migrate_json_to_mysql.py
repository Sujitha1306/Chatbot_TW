import json
import logging
import os
import sys

# Add project root to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.app.db.mysql_pool import get_mysql_connection
from backend.app.db.conversation_store_mysql import _sanitize_for_storage

logger = logging.getLogger(__name__)

# -- PROVISIONAL SCHEMA: to be replaced with the official company
# schema once provided. Keep all table/column access isolated to
# MySQLConversationStore so a future schema swap doesn't ripple into the
# rest of the app.
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'analyst',
    created_at    DATETIME(6)  NOT NULL,
    UNIQUE INDEX idx_users_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversations (
    id          VARCHAR(36)  NOT NULL PRIMARY KEY,
    user_id     VARCHAR(64)  NOT NULL,
    title       VARCHAR(255) NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    INDEX idx_user_created (user_id, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS messages (
    id              VARCHAR(36)  NOT NULL PRIMARY KEY,
    conversation_id VARCHAR(36)  NOT NULL,
    role            VARCHAR(16)  NOT NULL,
    content         TEXT         NOT NULL,
    sql_text        TEXT         NULL,
    row_count       INT          NOT NULL DEFAULT 0,
    domain          VARCHAR(32)  NOT NULL DEFAULT 'porter',
    data_json       JSON         NULL,
    chart_spec_json JSON         NULL,
    created_at      DATETIME(6)  NOT NULL,
    INDEX idx_conv_created (conversation_id, created_at),
    FULLTEXT INDEX idx_content_fulltext (content),
    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB;
"""

def migrate():
    logging.basicConfig(level=logging.INFO)
    conn = get_mysql_connection()
    cursor = conn.cursor()

    try:
        # Create schema
        logger.info("Initializing schema...")
        for statement in SCHEMA.split(';'):
            if statement.strip():
                cursor.execute(statement)
        conn.commit()

        # Read JSON file
        json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.data/conversations.json'))
        if not os.path.exists(json_path):
            logger.warning(f"No existing JSON file found at {json_path}. Nothing to migrate.")
            return

        with open(json_path, 'r') as f:
            data = json.load(f)

        logger.info(f"Loaded {len(data)} user records from JSON")
        
        conv_count = 0
        msg_count = 0

        # Note: the JSON file is structured as { user_id: { conv_id: { "id": "...", "messages": [...] } } }
        for user_id, convs in data.items():
            for conv_id, conv in convs.items():
                cursor.execute(
                    "INSERT IGNORE INTO conversations (id, user_id, title, created_at) VALUES (%s, %s, %s, %s)",
                    (conv.get('id', conv_id), conv.get('user_id', user_id), conv.get('title', 'New Conversation'), conv.get('created_at', '2000-01-01 00:00:00'))
                )
                conv_count += 1
                
                messages = conv.get('messages', [])
                for msg in messages:
                    # Pack extra fields
                    packed_data = {
                        "data": msg.get('data', []),
                        "facility_id": msg.get('facility_id'),
                        "filters": msg.get('filters'),
                        "displaySections": msg.get('displaySections', []),
                        "crossConversationRefs": msg.get('crossConversationRefs', [])
                    }
                    
                    cursor.execute(
                        """
                        INSERT IGNORE INTO messages 
                        (id, conversation_id, role, content, sql_text, row_count, domain, data_json, chart_spec_json, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            msg.get('id'), conv_id, msg.get('role', 'user'), msg.get('content', ''),
                            msg.get('sql', ''), msg.get('row_count', 0), msg.get('domain', 'porter'),
                            _sanitize_for_storage(packed_data),
                            _sanitize_for_storage(msg.get('chartSpec', {})),
                            msg.get('timestamp', '2000-01-01 00:00:00')
                        )
                    )
                    msg_count += 1

        conn.commit()
        logger.info(f"Migration successful! Migrated {conv_count} conversations and {msg_count} messages.")

    except Exception as e:
        conn.rollback()
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
