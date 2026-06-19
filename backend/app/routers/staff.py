from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.services.staff import list_staff, create_staff
from app.services.staff import delete_staff as delete_staff_service
from app.schemas.staff import StaffCreate
from app.models.staff import Staff

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])

@router.get("/stores/{storeId}/staff")
async def get_staff(storeId: str):
    return list_staff(storeId)

@router.post("/stores/{storeId}/staff")
async def post_staff(storeId: str, body: StaffCreate):
    return create_staff(storeId, body)

@router.delete("/stores/{storeId}/staff/{staffId}", status_code=204)
async def delete_staff(storeId: str, staffId: str):
    try:
        delete_staff_service(storeId, staffId)
    except Staff.DoesNotExist:
        raise HTTPException(status_code=404, detail="staff not found")