from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    DB에서 이메일로 사용자를 찾아서 반환. 없으면 None.
    비유: 회원 명단에서 이름으로 찾기 — 없으면 "없음" 반환.
    """
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """
    새 회원을 DB에 저장하고 User 객체를 반환.
    """

    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 이메일입니다.",
        )

    hashed_pw = hash_password(user_data.password)

    new_user = User(
        email=user_data.email,
        password=hashed_pw,
        nickname=user_data.nickname,
    )

    db.add(new_user)
    await db.flush()

    await db.refresh(new_user)

    return new_user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """
    이메일 + 비밀번호로 사용자를 인증하고 User 객체를 반환.
    실패하면 HTTPException 발생.
    """

    user = await get_user_by_email(db, email)

    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다.",
        )

    return user
