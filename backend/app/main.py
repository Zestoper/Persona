# ── 표준 라이브러리 ───────────────────────────────────────
from contextlib import asynccontextmanager
# asynccontextmanager : 비동기 함수를 "시작 전 / 실행 중 / 종료 후" 3단계로 나눠주는 도구
# yield 위 = 앱 시작 시 실행, yield 아래 = 앱 종료 시 실행

from pathlib import Path
# Path : 파일/폴더 경로를 다루는 클래스 (문자열보다 안전하게 경로 조작 가능)

from fastapi import FastAPI
# FastAPI : 웹 서버 앱을 만드는 핵심 클래스

from fastapi.middleware.cors import CORSMiddleware
# CORSMiddleware : 프론트엔드(다른 포트/도메인)에서 이 서버로 요청할 수 있게 허용해주는 미들웨어
# 미들웨어 = 요청이 들어올 때마다 자동으로 중간에서 실행되는 코드

from fastapi.staticfiles import StaticFiles
# StaticFiles : 이미지, CSS 같은 정적 파일을 URL로 제공할 때 사용

from sqlalchemy import text
# text : 순수 SQL 문자열을 SQLAlchemy에서 실행할 때 쓰는 래퍼
# 예: text("ALTER TABLE ...") → 직접 SQL 실행

# ── 내부 모듈 ─────────────────────────────────────────────
from app.core.config import settings      # .env에서 읽어온 환경변수 객체
from app.db.database import engine, Base  # DB 엔진(연결) + 테이블 모델 부모 클래스
import app.models  # noqa: F401
# app.models 를 임포트해야 User, Persona 등 모든 모델 클래스가 메모리에 올라옴
# Base.metadata.create_all 이 테이블을 만들려면 모델들이 미리 임포트돼 있어야 함
# noqa: F401 → "임포트 후 사용 안 해도 경고 무시해" (린터용 주석)

from app.api.v1.router import api_router  # 모든 API 엔드포인트를 하나로 묶은 라우터


# ── 앱 시작/종료 시 실행할 코드 ────────────────────────────
# 비유: 식당 오픈(startup) 시 테이블 세팅, 마감(shutdown) 시 청소
# @asynccontextmanager 덕분에 yield 위아래로 시작/종료 코드를 나눌 수 있음
@asynccontextmanager
async def lifespan(app: FastAPI):

    # ── [ 앱 시작 시 실행 ] ────────────────────────────────
    async with engine.begin() as conn:
        # engine.begin() : 트랜잭션을 열고 DB 연결을 가져옴
        # async with ~ as conn : 트랜잭션 종료 시 자동으로 commit or rollback

        await conn.run_sync(Base.metadata.create_all)
        # Base.metadata.create_all : 모든 모델(User, Persona 등)을 DB 테이블로 생성
        # 이미 테이블이 있으면 건너뜀 (덮어쓰지 않음)
        # run_sync : create_all은 동기 함수라서 비동기 환경에서 쓰려면 run_sync로 감싸야 함

        # 기존 테이블에 새 컬럼이 없으면 추가 (있으면 무시)
        # 비유: 이미 있는 테이블에 새 열(칸)을 추가하는 것
        # IF NOT EXISTS → 컬럼이 이미 있어도 에러 안 남
        for sql in [
            "ALTER TABLE personas ADD COLUMN IF NOT EXISTS tags VARCHAR(500)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE",
        ]:
            await conn.execute(text(sql))

    print(f"✅ {settings.APP_NAME} 서버 시작!")

    yield  # ← 여기서 앱이 실제로 실행됨 (요청을 받기 시작)
    # yield 위 = 시작 시 실행
    # yield 아래 = 종료 시 실행

    # ── [ 앱 종료 시 실행 ] ────────────────────────────────
    await engine.dispose()
    # dispose() : 엔진이 들고 있던 DB 연결 풀을 전부 닫음
    # 서버 종료 시 연결을 안 닫으면 DB 쪽에서 연결이 남아있는 문제 발생
    print("🛑 서버 종료, DB 연결 정리 완료")


# ── FastAPI 앱 인스턴스 생성 ───────────────────────────────
# 비유: 식당 간판 달기. 이 객체가 모든 API 요청을 받는 진입점.
app = FastAPI(
    title=settings.APP_NAME,                # Swagger 문서(/docs) 상단 제목
    description="AI 페르소나 챗봇 빌더 API",  # Swagger 문서 설명
    version="0.1.0",                         # API 버전 표시
    lifespan=lifespan,                       # 위에서 만든 시작/종료 함수 연결
    docs_url="/docs" if settings.DEBUG else None,   # DEBUG=True 일 때만 /docs 접근 가능
    redoc_url="/redoc" if settings.DEBUG else None, # DEBUG=True 일 때만 /redoc 접근 가능
    # 운영 환경(DEBUG=False)에서는 API 문서를 외부에 노출하면 보안상 위험
)


# ── CORS 미들웨어 설정 ─────────────────────────────────────
# CORS(Cross-Origin Resource Sharing) :
#   브라우저는 기본적으로 다른 도메인/포트로 요청을 막음
#   예: 프론트(localhost:5173) → 백엔드(localhost:8000) 요청 → 브라우저가 차단
#   이걸 허용해주는 설정이 CORS 미들웨어
#
# 비유: 아파트 경비원 — 허용된 방문객(프론트 도메인)만 통과시킴
_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
# ALLOWED_ORIGINS = "http://localhost:5173,https://myprod.com" 처럼 쉼표로 구분된 문자열
# split(",") → ["http://localhost:5173", "https://myprod.com"] 리스트로 변환
# strip() → 각 항목 앞뒤 공백 제거

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,      # 허용할 프론트엔드 주소 목록
    allow_credentials=True,      # 쿠키/인증 헤더 포함 요청 허용
    allow_methods=["*"],         # 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
    allow_headers=["*"],         # 모든 헤더 허용 (Authorization 헤더 등)
)


# ── 정적 파일 서빙 ─────────────────────────────────────────
# 업로드된 아바타 이미지 등을 URL로 접근할 수 있게 제공
# 예: /static/avatars/abc.png → 실제 파일: backend/static/avatars/abc.png
STATIC_DIR = Path(__file__).parent.parent / "static"
# __file__ : 현재 파일(main.py)의 절대 경로
# .parent   : main.py가 있는 폴더(app/)
# .parent   : 한 단계 더 위(backend/)
# / "static" : backend/static 폴더
STATIC_DIR.mkdir(exist_ok=True)
# exist_ok=True : 폴더가 이미 있어도 에러 안 남

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
# /static URL로 들어오는 요청을 STATIC_DIR 폴더에서 파일을 찾아서 응답


# ── API 라우터 연결 ────────────────────────────────────────
# api_router 안에 auth, personas, chat 등 모든 엔드포인트가 묶여 있음
# prefix="/api/v1" 을 붙여서 모든 경로 앞에 자동으로 추가됨
# 예: auth.router의 /register → 최종 경로: /api/v1/auth/register
#     personas.router의 /  → 최종 경로: /api/v1/personas
app.include_router(api_router, prefix="/api/v1")


# ── 헬스체크 엔드포인트 ────────────────────────────────────
# 서버가 살아있는지 확인하는 용도
# 배포 환경에서 AWS, 서버 모니터링 도구가 주기적으로 GET /health 호출해서 확인
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",               # 서버 정상 응답 표시
        "app": settings.APP_NAME,     # 앱 이름
        "version": "0.1.0",           # 버전
    }


# ── 루트 엔드포인트 ────────────────────────────────────────
# GET / 로 접속했을 때 반기는 메시지 반환
# 비유: 식당 입구에 붙어있는 "환영합니다" 안내판
@app.get("/", tags=["System"])
async def root():
    return {"message": f"👋 {settings.APP_NAME} API에 오신 것을 환영합니다!"}
