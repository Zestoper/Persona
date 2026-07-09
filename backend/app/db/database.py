import ssl
import certifi
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

_url = settings.DATABASE_URL

if _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)

_needs_ssl = "?" in _url
_url = _url.split("?")[0]

if _needs_ssl:

    _ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    _connect_args = {"ssl": _ssl_ctx}
else:
    _connect_args = {}

engine = create_async_engine(
    _url,
    echo=settings.DEBUG,
    pool_size=2,
    max_overflow=3,
    pool_timeout=30,
    pool_recycle=300,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,

)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
