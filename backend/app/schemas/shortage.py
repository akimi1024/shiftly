from pydantic import BaseModel, Field

class ShortageResponse(BaseModel):
    date: str
    time: str
    required_count: int
    available_count: int
    shortage: int