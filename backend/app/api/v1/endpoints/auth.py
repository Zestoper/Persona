# ── 임포트 ────────────────────────────────────────────────
from fastapi import APIRouter, Depends, status
# APIRouter : 엔드포인트를 그룹으로 묶는 도구 (미니 앱 같은 것)
# Depends   : 의존성 주입 — 함수 실행 전에 다른 함수를 먼저 실행시킴
# status    : HTTP 상태 코드 상수 모음

from sqlalchemy.ext.asyncio import AsyncSession  # 비동기 DB 세션 타입

from app.db.database import get_db               # DB 세션 의존성 함수
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, PasswordUpdate, Token
from app.services.user_service import create_user, authenticate_user
from app.core.security import create_access_token, get_current_user, verify_password, hash_password
from app.models.user import User                 # 타입 힌트용


# ── 라우터 생성 ────────────────────────────────────────────
# prefix="/auth" : 이 라우터의 모든 경로 앞에 /auth가 붙음
# 예) @router.post("/register") → 실제 경로: /api/v1/auth/register
router = APIRouter(prefix="/auth", tags=["Auth"])


# ── 1. 회원가입 ────────────────────────────────────────────
# POST /api/v1/auth/register
@router.post(
    "/register",
    response_model=UserResponse,          # 응답을 UserResponse 형식으로 변환
    status_code=status.HTTP_201_CREATED,  # 성공 시 200이 아닌 201(Created) 반환
)
async def register(
    user_data: UserCreate,                # 요청 바디 → UserCreate 스키마로 자동 파싱+검증
    db: AsyncSession = Depends(get_db),   # DB 세션 자동 주입 (요청 끝나면 자동 닫힘)
):
    """
    새 회원을 등록합니다.
    성공: 201 + 회원 정보 (비밀번호 제외)
    실패: 409 (이메일 중복) / 422 (입력값 오류)
    """
    new_user = await create_user(db, user_data)  # user_service 함수 호출
    return new_user  # UserResponse 스키마가 자동으로 필요한 필드만 골라서 반환


# ── 2. 로그인 ──────────────────────────────────────────────
# POST /api/v1/auth/login
@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,               # 요청 바디 → UserLogin 스키마 (email + password)
    db: AsyncSession = Depends(get_db),
):
    """
    이메일/비밀번호로 로그인하고 JWT 토큰을 발급합니다.
    성공: 200 + { access_token, token_type }
    실패: 401 (이메일/비밀번호 불일치)

    발급받은 토큰은 이후 요청의 헤더에 이렇게 담아서 보내야 함:
    Authorization: Bearer <토큰>
    """
    # ── 이메일+비밀번호 검증 ───────────────────────────────
    user = await authenticate_user(db, user_data.email, user_data.password)

    # ── JWT 토큰 생성 ──────────────────────────────────────
    # "sub" : JWT 표준 필드명, subject(주체)를 의미 — 여기서는 user_id를 담음
    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(access_token=access_token)  # { access_token: "eyJ...", token_type: "bearer" }


# ── 3. 내 정보 조회 ────────────────────────────────────────
# GET /api/v1/auth/me
@router.get("/me", response_model=UserResponse)
async def get_me(
    # get_current_user : JWT 토큰 검증 후 User 객체 반환
    # Depends로 감싸면 → 요청마다 자동으로 실행됨 (토큰 없으면 401 에러)
    current_user: User = Depends(get_current_user),
):
    """
    현재 로그인한 회원의 정보를 반환합니다.
    헤더에 유효한 JWT 토큰이 없으면 401 에러.
    """
    return current_user


# ── 4. 닉네임 변경 ────────────────────────────────────────
# PUT /api/v1/auth/me
@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.nickname = update_data.nickname
    return current_user


# ── 5. 비밀번호 변경 ──────────────────────────────────────
# PUT /api/v1/auth/me/password
@router.put("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_password(
    update_data: PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(update_data.current_password, current_user.password):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    current_user.password = hash_password(update_data.new_password)


# ── 6. 회원탈퇴 ──────────────────────────────────────────
# DELETE /api/v1/auth/me
@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.delete(current_user)
