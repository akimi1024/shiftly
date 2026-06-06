from pynamodb.models import Model

class BaseModel(Model):
    class Meta:
        table_name = "shiftly"
        region = "ap-northeast-1"
