import time
from dotenv import load_dotenv
load_dotenv()
from backend.app.db.mysql_pool import get_mysql_connection

print("First connection...")
t0 = time.time()
conn1 = get_mysql_connection()
print(f"First connection took {time.time()-t0:.2f}s")
conn1.close()

print("Second connection...")
t1 = time.time()
conn2 = get_mysql_connection()
print(f"Second connection took {time.time()-t1:.2f}s")
conn2.close()
