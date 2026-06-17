from pydantic import BaseModel, Field

class ShiftRequestBase(BaseModel):
    date: str
    staff_id: str
    start_time: str
    end_time: str

class ShiftRequestCreate(ShiftRequestBase):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    staff_id: str = Field(..., min_length=1)
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')

class ShiftRequestResponse(ShiftRequestBase):
    pass

class ShiftRequestBulkCreate(BaseModel):
    requests: list[ShiftRequestCreate]