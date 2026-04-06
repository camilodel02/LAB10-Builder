from fastapi import APIRouter

from lab10_api.api.routes import expenses, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(expenses.router, tags=["expenses"])
