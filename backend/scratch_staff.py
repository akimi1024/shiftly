import os
os.environ["DYNAMODB_HOST"] = "http://localhost:8000"
os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"
os.environ["AWS_DEFAULT_REGION"] = "ap-northeast-1"

from app.models.staff import Staff
from app.utils.keys import StaffKey

STORE = "A001"

def staff(staff_id, name, role):
    Staff(
        StaffKey.pk(STORE), StaffKey.sk(staff_id),
        staff_id=staff_id, name=name, role=role,
    ).save()

staff("STAFF01", "田中", "manager")
staff("STAFF02", "鈴木", "staff")
staff("STAFF03", "佐藤", "staff")
staff("STAFF04", "高橋", "staff")

print("seeded staff for", STORE)
