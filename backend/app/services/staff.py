from app.models.staff import Staff
from app.schemas.staff import StaffResponse, StaffCreate
from app.utils.keys import StaffKey, StoreKey
from app.models.store import Store

def list_staff(store_id: str) -> list[StaffResponse]:
    items = Staff.query(
        StaffKey.pk(store_id)
    )

    return[
        StaffResponse(
            staff_id=item.staff_id,
            name=item.name,
            role=item.role
        )for item in items
    ]

def create_staff(store_id: str, req: StaffCreate) -> StaffResponse:
    store = Store.get(StoreKey.pk(store_id), StoreKey.sk())
    store.update(actions=[Store.staff_seq.add(1)])
    seq = store.staff_seq
    staff_id = f"{store_id}-{seq:03d}"
    Staff(
        StaffKey.pk(store_id), StaffKey.sk(staff_id),
        staff_id=staff_id, name=req.name, role=req.role,
    ).save()
    return StaffResponse(staff_id=staff_id, name=req.name, role=req.role)

def delete_staff(store_id: str, staff_id: str) -> None:
    pk = StaffKey.pk(store_id)
    sk = StaffKey.sk(staff_id)
    target = Staff.get(pk, sk)
    target.delete()