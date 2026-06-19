from pydantic import BaseModel, Field

class StaffResponse(BaseModel):
    staff_id: str
    name: str
    role: str

class StaffCreate(BaseModel):
    name: str = Field(..., min_length=1)
    role: str = Field(..., pattern=r'^(manager|staff)$')