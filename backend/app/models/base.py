from pynamodb.models import Model
from pynamodb.attributes import UTCDateTimeAttribute
from datetime import datetime, timezone

class BaseModel(Model):
    class Meta:
        table_name = "shiftly"
        region = "ap-northeast-1"

    created_at = UTCDateTimeAttribute(default=lambda: datetime.now(timezone.utc))