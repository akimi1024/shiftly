from fastapi import Header, HTTPException

# 1. 共通の前処理を関数で定義
def require_manager(x_role: str = Header(...)) -> None:
    if x_role != "manager":
        raise HTTPException(status_code=403, detail="manager only")