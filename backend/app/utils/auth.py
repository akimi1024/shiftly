import os
from fastapi import Header, HTTPException

# 1. 共通の前処理を関数で定義
def require_manager(x_role: str = Header(...)) -> None:
    if x_role != "manager":
        raise HTTPException(status_code=403, detail="manager only")
    
def require_token(x_auth_token: str | None = Header(default=None)):
    expected = os.environ.get("API_TOKEN")
    if not expected:
        return
    if x_auth_token != expected:
        raise HTTPException(status_code=401, detail="invalid token")