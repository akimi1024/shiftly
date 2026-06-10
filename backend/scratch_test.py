import os
os.environ["DYNAMODB_HOST"] = "http://localhost:8000"
os.environ["AWS_ACCESS_KEY_ID"] = "dummy"
os.environ["AWS_SECRET_ACCESS_KEY"] = "dummy"
os.environ["AWS_DEFAULT_REGION"] = "ap-northeast-1"

from app.models.shift_request import ShiftRequest
from app.schemas.shift_request import ShiftRequestCreate
from app.services.shift_request import create_request, list_requests, delete_request

if not ShiftRequest.exists():
    ShiftRequest.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)

create_request("A001", ShiftRequestCreate(date="2026-06-01", staff_id="STAFF01", start_time="09:00", end_time="13:00"))
create_request("A001", ShiftRequestCreate(date="2026-06-30", staff_id="STAFF02", start_time="17:00", end_time="22:00"))

create_request("A001", ShiftRequestCreate(date="2026-07-05", staff_id="STAFF01", start_time="10:00", end_time="15:00"))

print("--- 削除前（6月分）---")
result = list_requests("A001", "2026-06-01", "2026-06-30")
for r in result:
    print(r.model_dump())
print(f"件数: {len(result)}")

# 6/30 を削除
delete_request("A001", "2026-06-30", "STAFF02")

print("--- 削除後（6月分）---")
result = list_requests("A001", "2026-06-01", "2026-06-30")
for r in result:
    print(r.model_dump())
print(f"件数: {len(result)}")

# 冪等性の確認: 存在しないものを再度削除してもエラーにならない
delete_request("A001", "2026-06-30", "STAFF02")
print("--- 冪等削除（存在しないものを再削除）: エラーなく通過 ---")