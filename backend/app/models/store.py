from app.models.base import BaseModel
from pynamodb.attributes import UnicodeAttribute, UTCDateTimeAttribute
from datetime import datetime, timezone

class Store(BaseModel):
    PK = UnicodeAttribute(hash_key=True)
    SK = UnicodeAttribute(range_key=True)
    name = UnicodeAttribute()
    created_at = UTCDateTimeAttribute(default=lambda: datetime.now(timezone.utc))
