from fastapi import FastAPI
from app.routers import shift_requests

app = FastAPI()
app.include_router(shift_requests.router)