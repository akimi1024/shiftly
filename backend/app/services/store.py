from app.models.store import Store
from app.schemas.store import StoreResponse, StoreUpdate
from app.utils.keys import StoreKey

def get_store(store_id: str) -> StoreResponse:
    item = Store.get(StoreKey.pk(store_id), StoreKey.sk())
    return StoreResponse(name=item.name, open_time=item.open_time, close_time=item.close_time)

def update_store(store_id, req: StoreUpdate) -> StoreResponse:
    item = Store.get(StoreKey.pk(store_id), StoreKey.sk())
    item.update(actions=[
        Store.name.set(req.name),
        Store.open_time.set(req.open_time),
        Store.close_time.set(req.close_time)
    ])
    return StoreResponse(name=item.name, open_time=item.open_time, close_time=item.close_time)