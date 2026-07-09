from datetime import datetime, timedelta, timezone

from fastapi import Request
from jose import JWTError, jwt

from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.database import get_db

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def hash_password(password: str) -> str:
    """
    평문 비밀번호를 bcrypt로 암호화해서 반환.
    비유: 원본 문서를 금고에 넣고 잠근 뒤, 금고 번호만 저장.
         원본은 절대 꺼낼 수 없음.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    로그인 시 입력한 비밀번호와 DB의 암호화된 비밀번호를 비교.
    비유: 금고 번호를 대보는 것 — 원본을 꺼내는 게 아니라 번호가 맞는지만 확인.
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    """
    로그인 성공 시 JWT 토큰(신분증)을 만들어서 반환.
    비유: 놀이공원 입장권. 안에 "이 사람은 회원 id=5번" 정보가 들어있음.
          만료 시간이 지나면 자동으로 무효화됨.
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    JWT 토큰을 검증하고 → 토큰에 담긴 user_id로 DB에서 User 객체를 꺼내 반환.
    비유: 놀이공원 직원이 입장권을 스캔해서 유효하면 통과, 아니면 막음.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    from app.models.user import User
    from sqlalchemy import select

    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user

async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """토큰이 있으면 User 반환, 없거나 유효하지 않으면 None."""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        return await get_current_user(token=token, db=db)
    except Exception:
        return None
