from contextlib import asynccontextmanager

from pathlib import Path

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles

from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine, Base
import app.models

from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):

    async with engine.begin() as conn:

        await conn.run_sync(Base.metadata.create_all)

        for sql in [
            "ALTER TABLE personas ADD COLUMN IF NOT EXISTS tags VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
        ]:
            await conn.execute(text(sql))

    print(f"✅ {settings.APP_NAME} 서버 시작!")

    yield

    await engine.dispose()

    print("🛑 서버 종료, DB 연결 정리 완료")

app = FastAPI(
    title=settings.APP_NAME,
    description="AI 페르소나 챗봇 빌더 API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,

)

_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent.parent / "static"

STATIC_DIR.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "0.1.0",
    }

@app.get("/", tags=["System"])
async def root():
    return {"message": f"👋 {settings.APP_NAME} API에 오신 것을 환영합니다!"}
