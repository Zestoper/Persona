# ── SQLAlchemy 비동기 관련 모듈 임포트 ────────────────────
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# AsyncSession  : 비동기 DB 세션 타입 (쿼리를 await으로 실행)
# create_async_engine : 비동기 DB 연결 엔진 생성 함수
# async_sessionmaker  : 비동기 세션 팩토리 생성 함수

from sqlalchemy.orm import DeclarativeBase  # 모든 DB 모델의 부모 클래스
from app.core.config import settings        # 위에서 만든 설정 객체


# ── 비동기 DB 엔진 생성 ────────────────────────────────────
# 비유: 엔진 = 데이터베이스로 가는 '도로'. 한 번 만들어두면 계속 재사용.
engine = create_async_engine(
    settings.ASYNC_DATABASE_URL,  # asyncpg 호환 형식으로 자동 변환
    echo=settings.DEBUG,    # DEBUG=True면 실행되는 SQL을 터미널에 출력 (개발 시 유용)
    pool_size=10,           # 동시에 유지할 DB 연결 수 (식당의 테이블 수)
    max_overflow=20,        # pool_size 초과 시 임시로 더 열 수 있는 연결 수
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
