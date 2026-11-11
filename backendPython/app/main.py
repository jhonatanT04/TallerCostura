from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exceptions import register_exception_handlers
from app.routers import auth, empleados, ping, registros
from app.seed import seed_admin

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    seed_admin()
    yield


app = FastAPI(
    title="Costureria API",
    lifespan=lifespan,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

register_exception_handlers(app)

app.include_router(ping.router)
app.include_router(auth.router)
app.include_router(empleados.router)
app.include_router(registros.router)
