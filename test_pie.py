import requests
import json

BASE_URL = "http://127.0.0.1:8000/chat/stream"
HEADERS = {
    "accept": "text/event-stream",
    "Content-Type": "application/json",
    "Authorization": "Bearer test_token_123"
}

payload = {
    "user_id": "test-user",
    "session_id": "test-pie-1",
    "question": "Show asset status breakdown"
}

response = requests.post(BASE_URL, headers=HEADERS, json=payload)

events = []
for line in response.text.split('\n'):
    if line.startswith('data: '):
        try:
            data = json.loads(line[6:])
            events.append(data)
        except json.JSONDecodeError:
            pass

for ev in events:
    if ev.get("event") == "chart":
        print("CHART SPEC:", json.dumps(ev, indent=2))
        
