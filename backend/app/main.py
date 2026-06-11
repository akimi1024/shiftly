from fastapi import FastAPI
from app.routers import shift_requests, shift_requirements

app = FastAPI()
app.include_router(shift_requests.router)
app.include_router(shift_requirements.router)