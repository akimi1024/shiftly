from app.models.shift_request import ShiftRequest
from app.schemas.shift_request import ShiftRequestCreate, ShiftRequestResponse
from app.utils.keys import RequestKey


def create_request(store_id: str, req: ShiftRequestCreate) -> ShiftRequestResponse:
    # パスパラメータとBodyからキーを作成
    pk = RequestKey.pk(store_id)
    sk = RequestKey.sk(req.date, req.staff_id)

    # insert用の形に整形
    insert_request = ShiftRequest(pk, sk, date=req.date, staff_id=req.staff_id, start_time=req.start_time, end_time=req.end_time)

    # dbへ保存
    insert_request.save()

    # res用に整形
    return ShiftRequestResponse(
        date=req.date,
        staff_id=req.staff_id,
        start_time=req.start_time,
        end_time=req.end_time
    )


def list_requests(store_id: str, date_from: str, date_to: str) -> list[ShiftRequestResponse]:
    pk = RequestKey.pk(store_id)
    items = ShiftRequest.query(
        pk,
        ShiftRequest.SK.between(RequestKey.sk_date(date_from), RequestKey.sk_date_end(date_to))
    )
    return [
        ShiftRequestResponse(
            date=item.date,
            staff_id=item.staff_id,
            start_time=item.start_time,
            end_time=item.end_time
        )
        for item in items]


def delete_request(store_id: str, date: str, staff_id: str) -> None:
    pk = RequestKey.pk(store_id)
    sk = RequestKey.sk(date, staff_id)
    target = ShiftRequest.get(pk, sk)
    target.delete()