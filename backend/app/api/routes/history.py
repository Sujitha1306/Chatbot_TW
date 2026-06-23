from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from backend.app.db.conversation_store import _store
from backend.app.api.deps import require_api_key

router = APIRouter(prefix="/chat", tags=["history"])

import math
import numpy as np
from dataclasses import is_dataclass, asdict
from datetime import datetime

def clean_for_json(obj):
    if is_dataclass(obj):
        obj = asdict(obj)
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set)):
        return [clean_for_json(v) for v in obj]
    elif isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, (np.integer, np.floating)):
        if math.isnan(obj):
            return None
        return obj.item()
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

@router.get("/conversations")
def list_conversations(auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    convs = _store.list_conversations(user_id)
    return {"conversations": clean_for_json(convs)}

@router.get("/recommendations")
def list_recommendations(auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    # Fallback to empty list if _store doesn't support it yet
    recs = getattr(_store, "get_user_recommendations", lambda uid: [])(user_id)
    return {"recommendations": recs}

@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str, auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    msgs = _store.get_messages(user_id, conv_id)
    return {"messages": clean_for_json(msgs)}

from pydantic import BaseModel

class RenameRequest(BaseModel):
    title: str

@router.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: str, auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    ok = _store.delete(user_id, conv_id)
    return {"deleted": ok}

@router.delete("/conversations/{conv_id}/messages/{message_id}")
def delete_message(conv_id: str, message_id: str, auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    ok = getattr(_store, "truncate", lambda u, c, m: False)(user_id, conv_id, message_id)
    return {"truncated": ok}

@router.patch("/conversations/{conv_id}")
def rename_conversation(conv_id: str, req: RenameRequest, auth_data: dict = Depends(require_api_key)):
    user_id = auth_data.get("sub", "demo-user-001") if auth_data else "demo-user-001"
    ok = getattr(_store, "rename", lambda u, c, t: False)(user_id, conv_id, req.title)
    return {"renamed": ok}
