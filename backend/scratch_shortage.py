import os
os.environ["DYNAMODB_HOST"] = "http://localhost:8000"
os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"
os.environ["AWS_DEFAULT_REGION"] = "ap-northeast-1"

from app.models.store import Store
from app.models.shift_requirement import ShiftRequirement
from app.models.shift_request import ShiftRequest
from app.utils.keys import StoreKey, RequirementKey, RequestKey
from app.services.shortage import get_shortage

STORE = "A001"
DATE = "2026-06-12"

# --- seed: 深夜営業の店舗 ---
Store(StoreKey.pk(STORE), StoreKey.sk(), name="深夜居酒屋", open_time="18:00", close_time="02:00").save()

# --- seed: 必要人数 ---
def req(start, end, count):
    ShiftRequirement(
        RequirementKey.pk(STORE), RequirementKey.sk(DATE, start),
        date=DATE, start_time=start, end_time=end, required_count=count,
    ).save()

req("18:00", "22:00", 3)
req("22:00", "02:00", 2)

# --- seed: 希望 ---
def avail(staff, start, end):
    ShiftRequest(
        RequestKey.pk(STORE), RequestKey.sk(DATE, staff),
        date=DATE, staff_id=staff, start_time=start, end_time=end,
    ).save()

avail("STAFF01", "18:00", "23:00")
avail("STAFF02", "20:00", "02:00")
avail("STAFF03", "18:00", "21:00")

# --- 集計 ---
print("=== Shortage (2026-06-12) 不足/過剰のあるスロットのみ ===")
for r in get_shortage(STORE, DATE, DATE):
    print(f"{r.time}  required={r.required_count} available={r.available_count} shortage={r.shortage}")
