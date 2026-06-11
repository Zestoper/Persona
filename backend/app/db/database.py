# ── SQLAlchemy 비동기 관련 모듈 임포트 ────────────────────
import ssl
import certifi
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
# AsyncSession    : 비동기 방식으로 DB와 대화하는 세션 클래스
# create_async_engine : DB 연결 엔진을 만드는 함수 (엔진 = DB와의 물리적 연결)
# async_sessionmaker  : 세션을 찍어내는 공장 함수

from sqlalchemy.orm import DeclarativeBase
# DeclarativeBase : 모든 DB 모델(테이블)의 부모 클래스
# 이걸 상속받으면 파이썬 클래스가 자동으로 DB 테이블과 연결됨

from app.core.config import settings
# settings : .env 파일에서 읽어온 환경변수 묶음 (DATABASE_URL 등)


# ── DATABASE_URL → asyncpg 호환 형식으로 변환 ─────────────
# .env에서 읽어온 DB 주소를 asyncpg가 이해할 수 있는 형식으로 바꾸는 과정
_url = settings.DATABASE_URL
# 예: "postgresql://user:pass@host/dbname"

# postgresql:// → postgresql+asyncpg://
# SQLAlchemy한테 "asyncpg 통역사 써서 연결해" 라고 알려주는 것
# +asyncpg 없이는 어떤 드라이버로 연결할지 몰라서 에러 남
if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # replace("찾을것", "바꿀것", 1) → 딱 1번만 교체
    # 결과: "postgresql+asyncpg://user:pass@host/dbname"

# ── SSL 처리 ───────────────────────────────────────────────
# 클라우드 DB(예: Supabase, RDS)는 주소에 ?sslmode=require 같은 쿼리 파라미터가 붙음
# 예: "postgresql+asyncpg://user:pass@host/dbname?sslmode=require"
# asyncpg는 이 쿼리 파라미터 방식을 지원하지 않아서 직접 제거하고 SSL을 따로 설정해야 함
_needs_ssl = "?" in _url  # "?" 가 있으면 클라우드 DB → SSL 필요
_url = _url.split("?")[0]  # "?" 뒤를 전부 잘라냄
# 예: "...dbname?sslmode=require" → "...dbname"

if _needs_ssl:
    # certifi : 공인된 SSL 인증서 목록을 갖고 있는 라이브러리
    # "이 DB 서버 믿어도 돼?" 를 검증할 때 사용
    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    _connect_args = {"ssl": _ssl_ctx}  # 엔진에 SSL 설정 전달
else:
    _connect_args = {}  # 로컬 DB는 SSL 불필요


# ── 비동기 DB 엔진 생성 ────────────────────────────────────
# 엔진 = DB 서버와의 물리적 연결. 앱 전체에서 딱 1개만 만들어 공유함.
# 비유: 카페 건물 자체. 손님(요청)이 와도 건물은 하나임.
engine = create_async_engine(
    _url,                    # 연결할 DB 주소
    echo=settings.DEBUG,     # DEBUG=True 이면 실행되는 SQL을 터미널에 출력 (개발 시 디버깅용)
    pool_size=2,             # 항상 유지할 DB 연결 수 (대기 중인 직원 수)
    max_overflow=3,          # 바쁠 때 추가로 열 수 있는 연결 수 (임시 알바)
    pool_timeout=30,         # 연결 못 얻으면 30초 후 에러 발생
    pool_recycle=300,        # 연결을 300초(5분)마다 재생성 (오래된 연결 끊김 방지)
    connect_args=_connect_args,  # SSL 설정 전달
)


# ── 비동기 세션 팩토리 생성 ────────────────────────────────
# 세션 = DB와의 '대화 창구'. 요청마다 새 창구를 열고 끝나면 닫음.
# 비유: 카페의 주문 받는 직원. 손님(요청)마다 한 명씩 배치됨.
# async_sessionmaker = 직원을 찍어내는 공장
AsyncSessionLocal = async_sessionmaker(
    engine,                  # 어느 엔진(건물)에 연결할지
    class_=AsyncSession,     # 세션을 비동기 버전으로 만들기
    expire_on_commit=False,  # 커밋 후에도 객체 데이터를 메모리에 유지
                             # False 아니면 커밋 직후 객체 접근 시 추가 DB 조회 발생
)


# ── 모든 DB 모델의 부모 클래스 ─────────────────────────────
# models/user.py 에서 class User(Base) 이렇게 상속받으면
# 파이썬 클래스가 자동으로 DB 테이블과 연결됨
class Base(DeclarativeBase):
    pass


# ── DB 세션 의존성 함수 ────────────────────────────────────
# FastAPI의 Depends(get_db) 로 사용 — 요청마다 세션을 자동으로 열고 닫아줌
# 비유: 화장실 자동문 — 들어갈 때 열리고(yield 전), 나올 때 자동으로 닫힘(yield 후)
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:  # 세션 열기 (직원 배치)
        try:
            yield session           # API 함수에 세션 전달. 여기서 잠깐 멈추고 API 함수 실행됨.
            await session.commit()  # API 함수가 정상 종료되면 변경사항을 DB에 최종 저장
        except Exception:
            await session.rollback()  # 에러 발생 시 그 요청에서 한 변경사항 전부 취소 (원상복구)
            raise                   # 에러를 다시 위로 던져서 FastAPI가 처리하게 함
