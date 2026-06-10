from fastapi import APIRouter
router = APIRouter(prefix="/export", tags=["export"])

@router.get("/ping")
def ping():
    return {"status": "export routes active — implementation in Phase 5"}
