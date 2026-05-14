# ── 임포트 ────────────────────────────────────────────────
from datetime import datetime, timedelta, timezone  # 날짜/시간 계산용

from jose import JWTError, jwt
# jose  : JWT 토큰을 만들고 검증하는 라이브러리
# jwt   : JWT 관련 함수 모음
# JWTError : JWT 검증 실패 시 발생하는 에러 클래스

from passlib.context import CryptContext
# CryptContext : 비밀번호 암호화 방식을 설정하는 클래스
# bcrypt       : 비밀번호 해싱 알고리즘 (단방향 — 복호화 불가, 가장 안전한 방식)

from fastapi import Depends, HTTPException, status
# Depends     : 의존성 주입 도구 (함수를 다른 함수에 자동으로 연결)
# HTTPException : HTTP 에러 응답 생성
# status      : HTTP 상태 코드 상수 모음 (status.HTTP_401_UNAUTHORIZED 등)

from fastapi.security import OAuth2PasswordBearer
# OAuth2PasswordBearer : "Authorization: Bearer <토큰>" 헤더에서 토큰을 자동 추출

from sqlalchemy.ext.asyncio import AsyncSession  # 비동기 DB 세션 타입
from app.core.config import settings             # 환경변수 설정
from app.db.database import get_db              # DB 세션 의존성 함수


# ── 비밀번호 암호화 설정 ───────────────────────────────────
# 비유: "우리는 bcrypt 방식의 금고를 사용하겠다" 고 선언
pwd_context = CryptContext(
    schemes=["bcrypt"],   # 암호화 알고리즘: bcrypt 사용
    deprecated="auto",    # 구버전 알고리즘은 자동으로 새 버전으로 업그레이드
)

# ── OAuth2 토큰 추출기 설정 ────────────────────────────────
# 요청의 Authorization 헤더에서 Bearer 토큰을 자동으로 꺼내주는 도구
# tokenUrl : 토큰을 발급받는 API 경로 (Swagger 문서에서 자물쇠 아이콘 클릭 시 사용됨)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── 비밀번호 암호화 함수 ───────────────────────────────────
def hash_password(password: str) -> str:
    """
    평문 비밀번호를 bcrypt로 암호화해서 반환.
    비유: 원본 문서를 금고에 넣고 잠근 뒤, 금고 번호만 저장.
         원본은 절대 꺼낼 수 없음.
    """
    return pwd_context.hash(password)  # 예: "1234" → "$2b$12$abc...xyz"


# ── 비밀번호 검증 함수 ─────────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    로그인 시 입력한 비밀번호와 DB의 암호화된 비밀번호를 비교.
    비유: 금고 번호를 대보는 것 — 원본을 꺼내는 게 아니라 번호가 맞는지만 확인.
    """
    return pwd_context.verify(plain_password, hashed_password)
    # verify : 평문을 bcrypt로 암호화한 뒤 저장된 해시와 비교 → True/False 반환


# ── JWT 토큰 생성 함수 ─────────────────────────────────────
def create_access_token(data: dict) -> str:
    """
    로그인 성공 시 JWT 토큰(신분증)을 만들어서 반환.
    비유: 놀이공원 입장권. 안에 "이 사람은 회원 id=5번" 정보가 들어있음.
          만료 시간이 지나면 자동으로 무효화됨.
    """
    to_encode = data.copy()   # 원본 데이터 보호를 위해 복사본 사용

    # ── 만료 시간 계산 ─────────────────────────────────────
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES  # .env의 30분
    )

    to_encode.update({"exp": expire})  # 페이로드에 만료 시간 추가 (JWT 표준)

    # ── JWT 서명 및 인코딩 ─────────────────────────────────
    # jwt.encode(페이로드, 비밀키, 알고리즘) → 토큰 문자열 반환
    # 비유: 편지를 특수 잉크로 서명 — 서명이 없으면 위조로 판단
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,    # .env의 비밀 키 (이게 유출되면 토큰 위조 가능)
        algorithm=settings.ALGORITHM,  # HS256
    )
    return encoded_jwt


# ── 현재 로그인한 사용자 가져오기 ─────────────────────────
# FastAPI의 Depends()와 함께 사용 — 토큰이 유효한 요청만 통과시킴
async def get_current_user(
    token: str = Depends(oauth2_scheme),  # 헤더에서 토큰 자동 추출
    db: AsyncSession = Depends(get_db),   # DB 세션 자동 주입
):
    """
    JWT 토큰을 검증하고 → 토큰에 담긴 user_id로 DB에서 User 객체를 꺼내 반환.
    비유: 놀이공원 직원이 입장권을 스캔해서 유효하면 통과, 아니면 막음.
    """
    # ── 인증 실패 시 반환할 에러 미리 준비 ─────────────────
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,        # 401: 인증 실패
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},          # 표준 응답 헤더
    )

    try:
        # ── 토큰 디코딩 (서명 검증 + 만료 확인) ────────────
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: int = payload.get("sub")  # "sub" : JWT 표준 — 주체(subject) 필드
        if user_id is None:
            raise credentials_exception    # sub가 없으면 위조 토큰

    except JWTError:
        raise credentials_exception        # 서명 불일치 or 만료 → 에러

    # ── DB에서 사용자 조회 ─────────────────────────────────
    # 순환 임포트 방지를 위해 함수 안에서 임포트
    from app.models.user import User
    from sqlalchemy import select

    result = await db.execute(
        select(User).where(User.id == int(user_id))  # id로 유저 검색
    )
    user = result.scalar_one_or_none()  # 결과 1개 반환, 없으면 None

    if user is None:
        raise credentials_exception   # DB에 없는 유저면 에러 (탈퇴한 회원 등)

    return user  # User 객체 반환 → 엔드포인트에서 current_user로 사용
