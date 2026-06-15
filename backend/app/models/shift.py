from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute

class Shift(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    date = UnicodeAttribute()
    staff_id = UnicodeAttribute()
    start_time = UnicodeAttribute()
    end_time = UnicodeAttribute()