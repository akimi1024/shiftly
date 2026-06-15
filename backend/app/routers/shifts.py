from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.schemas.shift import ShiftBulkCreate, ShiftUpdate
from app.services.shift import create_shifts, list_shifts, update_shift
from app.services.shift import delete_shift as delete_shift_service
from app.models.shift import Shift

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])

@router.post("/stores/{storeId}/shifts")
async def post_shift(storeId: str, body: ShiftBulkCreate):
    return create_shifts(storeId, body)

@router.get("/stores/{storeId}/shifts")
async def get_shift(storeId: str, date_from: str, date_to: str):
    return list_shifts(storeId, date_from, date_to)

@router.put("/stores/{storeId}/shifts/{id}")
async def put_shift(storeId: str, id: str, body: ShiftUpdate):
    date, staff_id = id.split("#", 1)
    try:
        return update_shift(storeId, date, staff_id, body)
    except Shift.DoesNotExist:
        raise HTTPException(status_code=404, detail="shift not found")

@router.delete("/stores/{storeId}/shifts/{id}", status_code=204)
async def delete_shift(storeId: str, id: str):
    date, staff_id = id.split("#", 1)
    try:
        delete_shift_service(storeId, date, staff_id)
    except Shift.DoesNotExist:
        raise HTTPException(status_code=404, detail="shift not found")
