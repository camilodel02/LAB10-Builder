from fastapi import FastAPI

from lab10_api.api.router import api_router


def create_app() -> FastAPI:
    application = FastAPI(title="LAB10 API", version="0.1.0")
    application.include_router(api_router, prefix="/api")
    return application


app = create_app()
