from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import shift_requests, shift_requirements, shortage, shifts

app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(shift_requests.router)
app.include_router(shift_requirements.router)
app.include_router(shortage.router)
app.include_router(shifts.router)