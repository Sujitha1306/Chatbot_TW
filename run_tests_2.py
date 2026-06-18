import requests
import json

BASE_URL = "http://127.0.0.1:8000/chat/stream"
HEADERS = {
    "accept": "text/event-stream",
    "Content-Type": "application/json",
    "Authorization": "Bearer test_token_123"
}

def run_query(user_id, session_id, question, facility_id=None):
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "question": question
    }
    if facility_id:
        payload["facility_id"] = facility_id
        
    response = requests.post(BASE_URL, headers=HEADERS, json=payload)
    
    events = []
    for line in response.text.split('\n'):
        if line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                events.append(data)
            except json.JSONDecodeError:
                pass
                
    sql = ""
    text_response = ""
    error_msg = ""
    for ev in events:
        if ev.get("event") == "sql" or ev.get("event") == "sql_corrected":
            sql = ev.get("sql", sql) # use corrected if available
        elif ev.get("event") == "token":
            text_response += ev.get("text", "")
        elif ev.get("event") == "error":
            error_msg = ev.get("message", "Unknown error")
            
    return sql, text_response.strip(), error_msg, events

print("--- Running B8 ---")
sql, text, err, evs = run_query("test-user", "session-b8-2", "What is our porter completion rate by facility?")
print("SQL:", sql)
print("TEXT:", text)
print("ERROR:", err)

