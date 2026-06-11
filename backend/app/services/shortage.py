from app.models.shift_requirement import ShiftRequirement
from app.models.shift_request import ShiftRequest
from app.models.store import Store
from app.schemas.shortage import ShortageResponse
from app.utils.keys import StoreKey, RequestKey, RequirementKey
from app.utils.timeslot import to_hhmm, normalize

BUCKET = 30

def _covers(start_time: str, end_time: str, slot: int, open_time: str) -> bool:
    return normalize(start_time, open_time) <= slot < normalize(end_time, open_time)

def get_shortage(store_id: str, date_from: str, date_to: str) -> list[ShortageResponse]:
    store_item = Store.get(StoreKey.pk(store_id), StoreKey.sk())
    requirement_items = list(ShiftRequirement.query(
        RequirementKey.pk(store_id),
        ShiftRequirement.SK.between(RequirementKey.sk_date(date_from), RequirementKey.sk_date_end(date_to))
    ))
    request_items = list(ShiftRequest.query(
        RequestKey.pk(store_id),
        ShiftRequest.SK.between(RequestKey.sk_date(date_from), RequestKey.sk_date_end(date_to))
    ))

    # 日付昇順で重複排除
    dates = sorted({r.date for r in requirement_items} | {r.date for r in request_items})

    result = []
    open_time, close_time = store_item.open_time, store_item.close_time
    for date in dates:
        # 開店時間の正規化
        slot = normalize(open_time, open_time)
        # 日跨ぎケースで正規化
        close_norm = normalize(close_time, open_time)
        # slotごとに人員充足確認
        while slot < close_norm:
            # 時間帯ごとの必要人数取り出し
            required = sum(r.required_count for r in requirement_items
                        if r.date == date and _covers(r.start_time, r.end_time, slot, open_time))
            # 時間帯ごとの希望人数の取り出し
            available = sum(1 for r in request_items
                        if r.date == date and _covers(r.start_time, r.end_time, slot, open_time))
            shortage = required - available
            if shortage != 0:
                result.append(ShortageResponse(
                    date = date,
                    time = to_hhmm(slot),
                    required_count = required,
                    available_count = available,
                    shortage = shortage
                ))
            slot += BUCKET

    return result