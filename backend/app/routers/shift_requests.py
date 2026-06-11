from fastapi import APIRouter, Depends
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.schemas.shift_request import ShiftRequestCreate
from app.services.shift_request import create_request, list_requests
from app.services.shift_request import delete_request as delete_request_service

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])


@router.post("/stores/{storeId}/requests")
async def post_shift(storeId: str, body: ShiftRequestCreate):
    return create_request(storeId, body)

@router.get("/stores/{storeId}/requests")
async def get_shift(storeId: str, date_from: str, date_to: str):
    return list_requests(storeId, date_from, date_to)

@router.delete("/stores/{storeId}/requests/{id}")
async def delete_request(storeId: str, id: str):
    date, staff_id = id.split("#")
    return delete_request_service(storeId, date, staff_id)