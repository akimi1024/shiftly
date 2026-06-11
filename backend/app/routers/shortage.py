from fastapi import APIRouter, Depends
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.services.shortage import get_shortage as get_shortage_service

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])

@router.get("/stores/{storeId}/shortage")
async def get_shortage(storeId: str, date_from: str, date_to: str):
    return get_shortage_service(storeId, date_from, date_to)
