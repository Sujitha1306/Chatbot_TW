from fastapi import APIRouter
from backend.app.core.cache import get_cache_stats

router = APIRouter(tags=["health"])

@router.get("/health")
def health():
    return {"status": "ok", "cache": get_cache_stats()}
