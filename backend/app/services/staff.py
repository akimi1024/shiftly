from app.models.staff import Staff
from app.schemas.staff import StaffResponse
from app.utils.keys import StaffKey

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