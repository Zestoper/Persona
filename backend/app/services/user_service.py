# ── 임포트 ────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import AsyncSession  # 비동기 DB 세션 타입
from sqlalchemy import select                    # SELECT 쿼리 빌더
from fastapi import HTTPException, status        # HTTP 에러 응답

from app.models.user import User                 # users 테이블 모델
from app.schemas.user import UserCreate          # 회원가입 입력 스키마
from app.core.security import hash_password, verify_password  # 암호화 함수


# ── 이메일로 사용자 조회 ───────────────────────────────────
async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    DB에서 이메일로 사용자를 찾아서 반환. 없으면 None.
    비유: 회원 명단에서 이름으로 찾기 — 없으면 "없음" 반환.
    """
    result = await db.execute(
        select(User).where(User.email == email)  # WHERE email = 'abc@def.com'
    )
    return result.scalar_one_or_none()
    # scalar_one_or_none : 결과가 1개면 반환, 0개면 None, 2개 이상이면 에러


# ── 회원가입 ───────────────────────────────────────────────
async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """
    새 회원을 DB에 저장하고 User 객체를 반환.
    """
    # ── 이메일 중복 확인 ───────────────────────────────────
    existing_user = await get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,  # 409: 충돌 (이미 존재)
            detail="이미 사용 중인 이메일입니다.",
        )

    # ── 비밀번호 암호화 ────────────────────────────────────
    hashed_pw = hash_password(user_data.password)
    # 예: "mypassword123" → "$2b$12$KIXuj..." (bcrypt 해시)
    # 절대 평문을 DB에 저장하면 안 됨!

    # ── User 객체 생성 ─────────────────────────────────────
    new_user = User(
        email=user_data.email,      # 입력받은 이메일
        password=hashed_pw,         # 암호화된 비밀번호 (평문 아님!)
        nickname=user_data.nickname, # 닉네임
    )

    # ── DB에 저장 ──────────────────────────────────────────
    db.add(new_user)         # INSERT 준비 (아직 DB에 반영 안 됨)
    await db.flush()         # INSERT 실행 + id 값 채우기 (커밋은 아님)
    # flush vs commit 차이:
    # flush  → DB에 SQL 실행하지만 트랜잭션은 열려있음 (롤백 가능)
    # commit → 트랜잭션 확정 (롤백 불가) — get_db()에서 자동으로 해줌
    await db.refresh(new_user)  # DB에서 최신 상태(created_at 등)를 객체에 반영

    return new_user


# ── 로그인 인증 ────────────────────────────────────────────
async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    """
    이메일 + 비밀번호로 사용자를 인증하고 User 객체를 반환.
    실패하면 HTTPException 발생.
    """
    # ── 사용자 조회 ────────────────────────────────────────
    user = await get_user_by_email(db, email)

    # ── 존재하지 않는 이메일 또는 비밀번호 불일치 ─────────
    # 보안상 "이메일이 없다"와 "비밀번호가 틀렸다"를 같은 메시지로 응답
    # 이유: 다르게 응답하면 공격자가 계정 존재 여부를 알 수 있음
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,  # 401: 인증 실패
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── 비활성 계정 확인 ───────────────────────────────────
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,  # 403: 접근 금지
            detail="비활성화된 계정입니다.",
        )

    return user
