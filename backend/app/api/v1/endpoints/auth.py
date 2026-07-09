from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import secrets

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from app.db.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, PasswordUpdate, Token
from app.services.user_service import create_user, authenticate_user
from app.core.security import create_access_token, get_current_user, verify_password, hash_password
from app.core.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    새 회원을 등록합니다.
    성공: 201 + 회원 정보 (비밀번호 제외)
    실패: 409 (이메일 중복) / 422 (입력값 오류)
    """
    new_user = await create_user(db, user_data)
    return new_user

@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    이메일/비밀번호로 로그인하고 JWT 토큰을 발급합니다.
    성공: 200 + { access_token, token_type }
    실패: 401 (이메일/비밀번호 불일치)

    발급받은 토큰은 이후 요청의 헤더에 이렇게 담아서 보내야 함:
    Authorization: Bearer <토큰>
    """

    user = await authenticate_user(db, user_data.email, user_data.password)

    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token)

@router.get("/me", response_model=UserResponse)
async def get_me(

    current_user: User = Depends(get_current_user),
):
    """
    현재 로그인한 회원의 정보를 반환합니다.
    헤더에 유효한 JWT 토큰이 없으면 401 에러.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.nickname = update_data.nickname
    await db.flush()
    return current_user

@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    update_data: PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(update_data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    current_user.password = hash_password(update_data.new_password)
    await db.flush()

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.delete(current_user)
    await db.flush()

async def get_or_create_social_user(db: AsyncSession, email: str, nickname: str) -> str:
    """소셜 이메일로 유저 조회 또는 신규 생성 후 JWT 반환."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password=hash_password(secrets.token_hex(32)),
            nickname=nickname,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
    return create_access_token(data={"sub": str(user.id)})

@router.get("/kakao")
async def kakao_login():
    if not settings.KAKAO_CLIENT_ID:
        raise HTTPException(status_code=503, detail="카카오 로그인이 설정되지 않았습니다.")
    url = (
        "https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        "&response_type=code"
    )
    return RedirectResponse(url)

@router.get("/kakao/callback")
async def kakao_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:

        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "redirect_uri": settings.KAKAO_REDIRECT_URI,
                "code": code,
            },
        )
        token_data = token_res.json()
        kakao_token = token_data.get("access_token")
        if not kakao_token:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=kakao_failed")

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {kakao_token}"},
        )
        user_data = user_res.json()

    kakao_account = user_data.get("kakao_account", {})
    email = kakao_account.get("email", f"kakao_{user_data['id']}@persona.app")
    nickname = user_data.get("properties", {}).get("nickname", "카카오유저")

    jwt = await get_or_create_social_user(db, email, nickname)
    await db.commit()
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt}")

@router.get("/google")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="구글 로그인이 설정되지 않았습니다.")
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
    )
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:

        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "code": code,
            },
        )
        token_data = token_res.json()
        google_token = token_data.get("access_token")
        if not google_token:
            return RedirectResponse(f"{settings.FRONTEND_URL}/login?error=google_failed")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_token}"},
        )
        user_data = user_res.json()

    email = user_data.get("email", "")
    nickname = user_data.get("name", "구글유저")

    jwt = await get_or_create_social_user(db, email, nickname)
    await db.commit()
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt}")
