from pydantic import BaseModel

class StaffResponse(BaseModel):
    staff_id: str
    name: str
    role: str