from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute

class Store(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    name = UnicodeAttribute()
