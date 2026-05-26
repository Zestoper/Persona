# ── Pydantic 임포트 ────────────────────────────────────────
from pydantic import BaseModel, EmailStr, field_validator
# BaseModel   : Pydantic 모델의 부모 클래스 (데이터 검증 기능 제공)
# EmailStr    : 이메일 형식인지 자동 검증하는 타입 (abc@def.com 형식 아니면 에러)
# field_validator : 특정 필드에 커스텀 검증 로직 추가하는 데코레이터

from datetime import datetime  # 날짜/시간 타입


# ── 회원가입 요청 스키마 ───────────────────────────────────
# 비유: 회원가입 폼의 '입력 규칙'. 이 형식과 다르면 FastAPI가 자동으로 400 에러 반환.
class UserCreate(BaseModel):
    email: EmailStr          # 이메일 형식 자동 검증
    password: str            # 비밀번호 (나중에 암호화해서 저장)
    nickname: str            # 닉네임

    # ── 비밀번호 길이 검증 ─────────────────────────────────
    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:                     # 8자 미만이면 에러
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v                           # 통과하면 그대로 반환

    # ── 닉네임 길이 검증 ───────────────────────────────────
    @field_validator("nickname")
    @classmethod
    def nickname_must_be_valid(cls, v: str) -> str:
        v = v.strip()                      # 앞뒤 공백 제거
        if len(v) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        if len(v) > 20:
            raise ValueError("닉네임은 20자 이하여야 합니다.")
        return v


# ── 로그인 요청 스키마 ─────────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr   # 이메일
    password: str     # 비밀번호 (평문 — 서버에서 암호화된 것과 비교)


# ── 회원 정보 응답 스키마 ──────────────────────────────────
# 비유: API가 돌려줄 '명함'. 비밀번호는 절대 포함하면 안 됨.
class UserResponse(BaseModel):
    id: int                # 회원 번호
    email: str             # 이메일
    nickname: str          # 닉네임
    is_active: bool        # 활성 여부
    is_admin: bool = False # 관리자 여부
    created_at: datetime   # 가입 일시

    class Config:
        # SQLAlchemy 모델 객체를 Pydantic 모델로 자동 변환 허용
        # 비유: DB에서 꺼낸 객체를 JSON으로 바꿀 때 자동으로 매핑해줌
        from_attributes = True


# ── 회원 정보 수정 스키마 ──────────────────────────────────
class UserUpdate(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def nickname_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        if len(v) > 20:
            raise ValueError("닉네임은 20자 이하여야 합니다.")
        return v


# ── 비밀번호 변경 스키마 ───────────────────────────────────
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v


# ── JWT 토큰 응답 스키마 ───────────────────────────────────
# 로그인 성공 시 이 형식으로 토큰을 돌려줌
class Token(BaseModel):
    access_token: str        # JWT 토큰 문자열 (eyJ... 로 시작하는 긴 문자열)
    token_type: str = "bearer"  # 토큰 종류 (항상 "bearer" — HTTP 표준)


# ── 토큰 내부 데이터 스키마 ───────────────────────────────
# JWT 토큰을 풀었을 때 나오는 데이터 형식
class TokenData(BaseModel):
    user_id: int | None = None  # 토큰에 담긴 회원 id (없으면 None)
