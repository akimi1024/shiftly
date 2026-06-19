from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute, NumberAttribute
class Store(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    name = UnicodeAttribute()
    open_time = UnicodeAttribute()
    close_time = UnicodeAttribute()
    staff_seq = NumberAttribute(default=0)