import time
from dotenv import load_dotenv
load_dotenv()
from backend.app.db.mysql_pool import get_mysql_connection

print("Connecting...")
conn = get_mysql_connection()
print("Executing recommendations query...")
t0 = time.time()
cursor = conn.cursor()
cursor.execute("""
    SELECT MIN(m.content) as original_content, COUNT(*) as frequency
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.user_id = %s AND m.role = 'user'
    GROUP BY LOWER(TRIM(REPLACE(REPLACE(m.content, '?', ''), '.', '')))
    HAVING COUNT(*) >= 3
    ORDER BY frequency DESC
    LIMIT 5
""", ("11453",))
rows = cursor.fetchall()
print(f"Query took {time.time()-t0:.2f}s, found {len(rows)} rows")
conn.close()
