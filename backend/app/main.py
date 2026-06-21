from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import shift_requests, shift_requirements, shortage, shifts, staff, store
from app.utils.auth import require_token
app = FastAPI(dependencies=[Depends(require_token)])

app.add_middleware(
  CORSMiddleware,
  # allow_origins=["http://localhost:3000"],
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(shift_requests.router)
app.include_router(shift_requirements.router)
app.include_router(shortage.router)
app.include_router(shifts.router)
app.include_router(staff.router)
app.include_router(store.router)