from pydantic import BaseModel, Field, model_validator

class ShiftBase(BaseModel):
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    staff_id: str = Field(..., min_length=1)
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')


class ShiftItem(ShiftBase):
    pass

class ShiftResponse(ShiftBase):
    pass

class ShiftBulkCreate(BaseModel):
    period_from: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    period_to: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')
    shifts: list[ShiftItem]

    @model_validator(mode="after")
    def check_period_(self):
        if self.period_from > self.period_to:
            raise ValueError("period_from must be <= period_to")
        for s in self.shifts:
            if not(self.period_from <= s.date <= self.period_to):
                raise ValueError(f"date {s.date} is out of period")
        return self

class ShiftUpdate(BaseModel):
    start_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
    end_time: str = Field(..., pattern=r'^\d{2}:\d{2}$')
