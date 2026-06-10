from fastapi import APIRouter, Depends
from backend.app.db.conversation_store import _store
from backend.app.api.deps import require_api_key

router = APIRouter(prefix="/chat", tags=["history"])

@router.get("/conversations")
def list_conversations(_=Depends(require_api_key)):
    return {"conversations": _store.list_conversations("default")}

@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str, _=Depends(require_api_key)):
    return {"messages": _store.get_messages("default", conv_id)}

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, _=Depends(require_api_key)):
    ok = _store.delete("default", conv_id)
    return {"deleted": ok}
