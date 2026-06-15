from app.models.shift import Shift
from app.schemas.shift import ShiftBulkCreate, ShiftResponse, ShiftUpdate
from app.utils.keys import ShiftKey

def create_shifts(store_id: str, req: ShiftBulkCreate) -> list[ShiftResponse]:
    pk = ShiftKey.pk(store_id)

    with Shift.batch_write() as batch:
        for item in req.shifts:
            batch.save(Shift(
                pk,
                ShiftKey.sk(item.date, item.staff_id),
                date=item.date,
                staff_id=item.staff_id,
                start_time=item.start_time,
                end_time=item.end_time)
            )

    return[
        ShiftResponse(
            date=item.date,
            staff_id=item.staff_id,
            start_time=item.start_time,
            end_time=item.end_time
        )
        for item in req.shifts
    ]

def list_shifts(store_id: str, date_from: str, date_to: str) -> list[ShiftResponse]:
    items = Shift.query(
        ShiftKey.pk(store_id),
        Shift.SK.between(ShiftKey.sk_date(date_from), ShiftKey.sk_date_end(date_to))
    )

    return[
        ShiftResponse(
            date = item.date,
            staff_id = item.staff_id,
            start_time = item.start_time,
            end_time = item.end_time
        )for item in items
    ]

def update_shift(store_id: str, date: str, staff_id: str, req: ShiftUpdate) -> ShiftResponse:
    pk = ShiftKey.pk(store_id)
    sk = ShiftKey.sk(date, staff_id)

    update_item = Shift.get(pk, sk)
    update_item.update(actions=[
        Shift.start_time.set(req.start_time),
        Shift.end_time.set(req.end_time)
    ])

    return ShiftResponse(
        date = update_item.date,
        staff_id = update_item.staff_id,
        start_time = update_item.start_time,
        end_time = update_item.end_time
    )

def delete_shift(store_id: str, date: str, staff_id: str) -> None:
    pk = ShiftKey.pk(store_id)
    sk = ShiftKey.sk(date, staff_id)
    target = Shift.get(pk, sk)
    target.delete()