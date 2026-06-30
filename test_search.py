import sys
import os
import dotenv
dotenv.load_dotenv()
sys.path.append(os.getcwd())
from backend.app.db.conversation_store import _store
res = _store.search_past_conversations("demo-user-001", ["name"])
print("Matches for 'name':", len(res))
for r in res:
    print(r["title"], r["match_count"])
    for msg in r["relevant_messages"]:
        print(msg)
