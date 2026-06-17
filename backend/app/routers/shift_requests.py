from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.schemas.shift_request import ShiftRequestCreate, ShiftRequestBulkCreate
from app.services.shift_request import create_request, list_requests, create_request_bulk
from app.services.shift_request import delete_request as delete_request_service
from app.models.shift_request import ShiftRequest

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])


@router.post("/stores/{storeId}/requests")
async def post_shift_request(storeId: str, body: ShiftRequestCreate):
    return create_request(storeId, body)

@router.post("/stores/{storeId}/requests/bulk")
async def post_bulk_request(storeId: str, body: ShiftRequestBulkCreate):
    return create_request_bulk(storeId, body)

@router.get("/stores/{storeId}/requests")
async def get_shift_request(storeId: str, date_from: str, date_to: str):
    return list_requests(storeId, date_from, date_to)

@router.delete("/stores/{storeId}/requests/{id}", status_code=204)
async def delete_request_request(storeId: str, id: str):
    date, staff_id = id.split("#")
    try:
        delete_request_service(storeId, date, staff_id)
    except ShiftRequest.DoesNotExist:
        raise HTTPException(status_code=404, detail="Request not found")
