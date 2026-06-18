from app.models.shift_requirement import ShiftRequirement
from app.models.shift_request import ShiftRequest
from app.models.store import Store
from app.schemas.shortage import ShortageResponse
from app.utils.keys import StoreKey, RequestKey, RequirementKey
from app.utils.timeslot import to_hhmm, normalize

BUCKET = 30

def _covers(start_time: str, end_time: str, slot: int, open_time: str, close_time: str) -> bool:
    return normalize(start_time, open_time, close_time) <= slot < normalize(end_time, open_time, close_time)

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
        date_reqs = [r for r in requirement_items if r.date == date]

        # 当日の最速のシフトを出す
        starts = [normalize(open_time, open_time, close_time)] + \
            [normalize(r.start_time, open_time, close_time) for r in date_reqs]
        # 当日の最終のシフトを出す
        ends = [normalize(close_time, open_time, close_time)] + \
            [normalize(r.end_time, open_time, close_time) for r in date_reqs]
        slot = min(starts)
        end_bound = max(ends)

        # slotごとに人員充足確認
        while slot < end_bound:
            # 時間帯ごとの必要人数取り出し
            required = sum(r.required_count for r in requirement_items
                        if r.date == date and _covers(r.start_time, r.end_time, slot, open_time, close_time))
            # 時間帯ごとの希望人数の取り出し
            available = sum(1 for r in request_items
                        if r.date == date and _covers(r.start_time, r.end_time, slot, open_time, close_time))
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