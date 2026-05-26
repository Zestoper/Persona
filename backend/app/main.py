# ── 표준 라이브러리 ───────────────────────────────────────
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

# ── 내부 모듈 ─────────────────────────────────────────────
from app.core.config import settings      # 환경변수 설정 객체
from app.db.database import engine, Base  # DB 엔진 + 모델 부모 클래스
import app.models  # noqa: F401 — 모든 모델을 임포트해야 Base.metadata가 테이블을 인식함
from app.api.v1.router import api_router  # v1 통합 라우터


# ── 앱 시작/종료 시 실행할 코드 ────────────────────────────
# 비유: 식당 오픈(startup) 시 테이블 세팅, 마감(shutdown) 시 청소
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── 앱 시작 시 ─────────────────────────────────────────
    # DB에 테이블이 없으면 자동으로 생성 (개발 편의용 — 실제 운영에선 alembic 사용)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # 모든 모델 → DB 테이블 생성
        # 기존 테이블에 새 컬럼 추가 (없으면 추가, 있으면 무시)
        for sql in [
            "ALTER TABLE personas ADD COLUMN IF NOT EXISTS tags VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
        ]:
            await conn.execute(text(sql))
    print(f"✅ {settings.APP_NAME} 서버 시작!")

    yield  # ← 여기서 앱이 실행됨 (요청을 받기 시작)

    # ── 앱 종료 시 ─────────────────────────────────────────
    await engine.dispose()  # DB 연결 풀 정리 (열어둔 연결 전부 닫기)
    print("🛑 서버 종료, DB 연결 정리 완료")


# ── FastAPI 앱 인스턴스 생성 ───────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,          # Swagger 문서 제목
    description="AI 페르소나 챗봇 빌더 API",  # Swagger 문서 설명
    version="0.1.0",                   # API 버전
    lifespan=lifespan,                 # 위에서 만든 시작/종료 핸들러 연결
    # DEBUG=False면 /docs, /redoc 엔드포인트를 숨김 (운영 환경 보안)
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# ── CORS 미들웨어 설정 ─────────────────────────────────────
# CORS: 브라우저가 다른 도메인의 API를 호출할 때 막는 보안 정책
# 비유: 우리 프론트(localhost:3000)가 백엔드(localhost:8000)에 편지 보낼 수 있게 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,   # 쿠키/인증 헤더 포함 요청 허용
    allow_methods=["*"],      # GET, POST, PUT, DELETE 등 모든 HTTP 메서드 허용
    allow_headers=["*"],      # Authorization 등 모든 요청 헤더 허용
)


# ── 정적 파일 서빙 (업로드된 아바타 이미지) ───────────────
STATIC_DIR = Path(__file__).parent.parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ── API 라우터 연결 ────────────────────────────────────────
# /api/v1 prefix를 붙여서 버전 관리
# 예) auth.router의 /register → 최종 경로: /api/v1/auth/register
app.include_router(api_router, prefix="/api/v1")


# ── 헬스체크 엔드포인트 ────────────────────────────────────
# 서버가 살아있는지 확인하는 용도 — 배포 환경에서 모니터링 도구가 주기적으로 호출
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",               # 서버 상태
        "app": settings.APP_NAME,     # 앱 이름
        "version": "0.1.0",           # 버전
    }


# ── 루트 엔드포인트 ────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    return {"message": f"👋 {settings.APP_NAME} API에 오신 것을 환영합니다!"}
