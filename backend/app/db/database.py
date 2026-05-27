# ── SQLAlchemy 비동기 관련 모듈 임포트 ────────────────────
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


# ── DATABASE_URL → asyncpg 호환 형식으로 변환 ─────────────
_url = settings.DATABASE_URL

# postgresql:// → postgresql+asyncpg://
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)

# 쿼리 파라미터(sslmode, channel_binding 등)는 asyncpg와 충돌하므로 제거
# SSL은 connect_args로 따로 전달
_needs_ssl = "?" in _url  # 쿼리 파라미터가 있으면 클라우드 DB → SSL 필요
_url = _url.split("?")[0]

_connect_args = {"ssl": True} if _needs_ssl else {}

# ── 비동기 DB 엔진 생성 ────────────────────────────────────
engine = create_async_engine(
    _url,
    echo=settings.DEBUG,
    pool_size=2,
    max_overflow=3,
    pool_timeout=30,
    pool_recycle=300,
    connect_args=_connect_args,
)

# ── 비동기 세션 팩토리 생성 ────────────────────────────────
# 비유: 세션 = DB와의 '대화 창구'. 요청마다 새 창구를 열고, 끝나면 닫음.
AsyncSessionLocal = async_sessionmaker(
    engine,                # 위에서 만든 엔진 연결
    class_=AsyncSession,   # 세션 클래스를 비동기 버전으로 지정
    expire_on_commit=False, # 커밋 후에도 객체 데이터를 메모리에 유지 (편의성)
)


# ── 모든 DB 모델의 부모 클래스 ─────────────────────────────
# 비유: 이 클래스를 상속받으면 자동으로 'DB 테이블과 연결된 파이썬 클래스'가 됨
class Base(DeclarativeBase):
    pass


# ── DB 세션 의존성 함수 ────────────────────────────────────
# FastAPI의 Depends()와 함께 사용 — 요청마다 세션을 자동으로 열고 닫아줌
# 비유: 화장실 자동문 — 들어갈 때 열리고(yield 전), 나올 때 닫힘(yield 후)
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:  # 세션 열기
        try:
            yield session        # 이 세션을 API 함수에 전달 (여기서 잠깐 멈춤)
            await session.commit()  # API 함수가 끝나면 변경사항 DB에 저장
        except Exception:
            await session.rollback()  # 에러 발생 시 변경사항 전부 취소 (원상복구)
            raise               # 에러를 다시 위로 던져서 FastAPI가 처리하게 함
