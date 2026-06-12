# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(export.router)
app.include_router(facilities.router)
