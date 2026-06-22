import requests
import json

url = "http://127.0.0.1:8000/chat/stream"
headers = {"Content-Type": "application/json"}
data = {
    "question": "Give me the porter performance summary for feb 2026",
    "user_id": "TW",
    "session_id": "test_session",
    "filters": {}
}

response = requests.post(url, headers=headers, json=data, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
