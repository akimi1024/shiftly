from fastapi import FastAPI
from app.routers import shift_requests, shift_requirements, shortage, shifts

app = FastAPI()
app.include_router(shift_requests.router)
app.include_router(shift_requirements.router)
app.include_router(shortage.router)
app.include_router(shifts.router)