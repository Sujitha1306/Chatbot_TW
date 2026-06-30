import sys
import os
import dotenv
dotenv.load_dotenv()
sys.path.append(os.getcwd())
from backend.app.db.mysql_pool import get_mysql_connection
conn = get_mysql_connection()
c = conn.cursor(dictionary=True)
c.execute("SELECT DISTINCT user_id FROM conversations")
print("User IDs:", c.fetchall())
c.execute("SELECT id, user_id, title FROM conversations ORDER BY created_at DESC LIMIT 5")
print("Conversations:", c.fetchall())

# Let's search for the word 'name' across ALL messages
c.execute("SELECT m.conversation_id, m.content FROM messages m WHERE m.content LIKE '%name%'")
print("Messages with 'name':", c.fetchall())
