from app.models.shift_requirement import ShiftRequirement
from app.schemas.shift_requirement import ShiftRequirementCreate, ShiftRequirementResponse, ShiftRequirementUpdate
from app.utils.keys import RequirementKey


def create_requirement(store_id: str, req: ShiftRequirementCreate) -> ShiftRequirementResponse:
    pk = RequirementKey.pk(store_id)
    sk = RequirementKey.sk(req.date, req.start_time)

    insert_requirement = ShiftRequirement(pk, sk, date=req.date, required_count=req.required_count, start_time=req.start_time, end_time=req.end_time)

    insert_requirement.save()

    return ShiftRequirementResponse(
        date=req.date,
        required_count=req.required_count,
        start_time=req.start_time,
        end_time=req.end_time
    )

def list_requirements(store_id: str, date_from: str, date_to: str) -> list[ShiftRequirementResponse]:
    pk = RequirementKey.pk(store_id)
    items = ShiftRequirement.query(
        pk,
        ShiftRequirement.SK.between(RequirementKey.sk_date(date_from), RequirementKey.sk_date_end(date_to))
    )
    return [
        ShiftRequirementResponse(
            date=item.date,
            required_count=item.required_count,
            start_time=item.start_time,
            end_time=item.end_time
        )
        for item in items
    ]

def update_requirement(store_id: str, date: str, start_time: str, req: ShiftRequirementUpdate) -> ShiftRequirementResponse:
    pk = RequirementKey.pk(store_id)
    sk = RequirementKey.sk(date, start_time)
    update_item = ShiftRequirement.get(pk, sk)
    update_item.update(actions=[
        ShiftRequirement.required_count.set(req.required_count),
        ShiftRequirement.end_time.set(req.end_time)
    ])
    return ShiftRequirementResponse(
        date=date,
        required_count=req.required_count,
        start_time=start_time,
        end_time=req.end_time
    )

def delete_requirement(store_id: str, date: str, start_time: str) -> None:
    pk = RequirementKey.pk(store_id)
    sk = RequirementKey.sk(date, start_time)
    ShiftRequirement(pk, sk).delete()