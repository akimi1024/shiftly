from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.models.store import Store
from app.schemas.store import StoreUpdate
from app.services.store import update_store as update_store_service
from app.services.store import get_store as get_store_service 

router = APIRouter(dependencies=[Depends(require_manager)])

@router.get("/stores/{storeId}")
async def get_store(storeId: str):
    try:
        return get_store_service(storeId)
    except Store.DoesNotExist:
        raise HTTPException(status_code=404, detail="store not found")


@router.put("/stores/{storeId}")
async def update_store(storeId: str, body: StoreUpdate):
    try:
        return update_store_service(storeId, body)
    except Store.DoesNotExist:
        raise HTTPException(status_code=404, detail="store not found")