from pydantic import BaseModel, Field

class StoreBase(BaseModel):
    name: str
    open_time: str
    close_time: str

class StoreResponse(StoreBase):
    pass

class StoreUpdate(StoreBase):
    name: str = Field(..., min_length=1)
    open_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    close_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')