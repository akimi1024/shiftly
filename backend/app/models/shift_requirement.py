from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

class ShiftRequirement(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    end_time = UnicodeAttribute()
    required_count = NumberAttribute()