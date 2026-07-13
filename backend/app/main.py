# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json
import logging

from backend.config.settings import settings
from backend.app.api.routes import chat, auth, health, history, export, facilities

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown events."""
    logger.info("TrackerWave API starting", extra={"env": settings.environment})
    # Warm up ClickHouse connection on startup
    from backend.app.db.clickhouse import ClickHouseConnection
    db = ClickHouseConnection()
    db.connect()
    logger.info("ClickHouse connection verified")
    yield
    logger.info("TrackerWave API shutting down")


app = FastAPI(
    title="TrackerWave Analytics API",
    version="4.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
)

_REDACTED_KEYS = {"password", "token", "api_key", "secret"}


def _redact(params: dict) -> dict:
    return {k: ("***" if k.lower() in _REDACTED_KEYS else v) for k, v in params.items()}


@app.middleware("http")
async def log_requests(request: Request, call_next):
    body_params = None
    if request.method in ("POST", "PUT", "PATCH") and "application/json" in request.headers.get("content-type", ""):
        try:
            raw = await request.body()
            if raw:
                parsed = json.loads(raw)
                if isinstance(parsed, dict):
                    body_params = _redact(parsed)
        except Exception:
            body_params = None
    logger.info(
        "Request: %s %s query_params=%s body_params=%s",
        request.method, request.url.path, dict(request.query_params), body_params,
    )
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(export.router)
app.include_router(facilities.router)
