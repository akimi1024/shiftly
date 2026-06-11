from fastapi import HTTPException
from app.models.store import Store
from app.utils.keys import StoreKey

def verify_store_exists(storeId: str):
    try:
        Store.get(StoreKey.pk(storeId), StoreKey.sk())
    except Store.DoesNotExist:
        raise HTTPException(status_code=404, detail="store not found")