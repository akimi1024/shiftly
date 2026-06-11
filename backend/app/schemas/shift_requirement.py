from pydantic import BaseModel, Field

class ShiftRequirementBase(BaseModel):
    date: str
    required_count: int
    start_time: str
    end_time: str


class ShiftRequirementCreate(ShiftRequirementBase):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    required_count: int = Field(..., ge=1, le=10)
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')


class ShiftRequirementResponse(ShiftRequirementBase):
    pass

class ShiftRequirementUpdate(BaseModel):
    required_count: int = Field(..., ge=1, le=10)
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')