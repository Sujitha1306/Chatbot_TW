from backend.app.api.routes.chat import QueryRequest
try:
    qr = QueryRequest(question="Hi", session_id="123", facility_id=None, user_id="TW")
    print("qr user id:", qr.user_id)
except Exception as e:
    print(e)
