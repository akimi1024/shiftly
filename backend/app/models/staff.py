from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute

class Staff(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    staff_id = UnicodeAttribute()
    name = UnicodeAttribute()
    role = UnicodeAttribute()