from fastapi import APIRouter, Depends, HTTPException
from app.utils.auth import require_manager
from app.utils.deps import verify_store_exists
from app.schemas.shift_requirement import ShiftRequirementCreate, ShiftRequirementUpdate
from app.models.shift_requirement import ShiftRequirement
from app.services.shift_requirement import create_requirement, list_requirements, update_requirement
from app.services.shift_requirement import delete_requirement as delete_requirement_service

router = APIRouter(dependencies=[Depends(require_manager), Depends(verify_store_exists)])


@router.post("/stores/{storeId}/requirements")
async def post_shift(storeId: str, body: ShiftRequirementCreate):
    return create_requirement(storeId, body)

@router.get("/stores/{storeId}/requirements")
async def get_shift(storeId: str, date_from: str, date_to: str):
    return list_requirements(storeId, date_from, date_to)

@router.put("/stores/{storeId}/requirements/{id}")
async def put_requirement(storeId: str, id: str, body: ShiftRequirementUpdate):
    date, start_time = id.split("#")
    try:
        return update_requirement(storeId, date, start_time, body)
    except ShiftRequirement.DoesNotExist:
        raise HTTPException(status_code=404, detail="requirement not found")

@router.delete("/stores/{storeId}/requirements/{id}", status_code=204)
async def delete_requirement(storeId: str, id: str):
    date, start_time = id.split("#")
    try:
        delete_requirement_service(storeId, date, start_time)
    except ShiftRequirement.DoesNotExist:
        raise HTTPException(status_code=404, detail="shiftRequirement not found")
