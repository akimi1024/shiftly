from fastapi import APIRouter, Depends
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.services.staff import list_staff

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])

@router.get("/stores/{storeId}/staff")
async def get_shift(storeId: str):
    return list_staff(storeId)