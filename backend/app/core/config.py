# ── 외부 라이브러리 임포트 ────────────────────────────────
from pydantic_settings import BaseSettings  # .env 파일을 자동으로 읽어주는 부모 클래스


class Settings(BaseSettings):
    """
    앱 전체에서 사용하는 설정값을 한 곳에 모아둔 클래스.
    비유: 앱의 '설정 메뉴' 화면 — 여기서 한 번만 바꾸면 전체에 적용됨.
    """

    # ── 앱 기본 정보 ───────────────────────────────────────
    APP_NAME: str = "AI 페르소나 챗봇 빌더"  # 앱 이름 (기본값 설정)
    DEBUG: bool = True                         # True면 에러 메시지를 자세히 보여줌

    # ── 데이터베이스 ───────────────────────────────────────
    DATABASE_URL: str  # .env에서 필수로 읽어옴 (기본값 없으면 없으면 앱 시작 실패)

    # ── JWT 인증 ───────────────────────────────────────────
    SECRET_KEY: str              # JWT 서명에 쓸 비밀 키 (.env에서 읽음)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # 토큰 유효 시간 (기본 30분)
    ALGORITHM: str = "HS256"     # JWT 서명 알고리즘 (HMAC + SHA256)

    # ── Groq AI ───────────────────────────────────────────
    GROQ_API_KEY: str  # Groq API 키 (.env에서 읽음)

    # ── 소셜 로그인 ───────────────────────────────────────
    KAKAO_CLIENT_ID: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/kakao/callback"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        # .env 파일 경로 지정 — pydantic이 자동으로 이 파일을 읽어서 위 변수들에 채워줌
        env_file = ".env"
        # 대소문자 구분 없이 환경변수 매핑 (DATABASE_URL = database_url 둘 다 OK)
        case_sensitive = False


# ── 전역 설정 객체 생성 ────────────────────────────────────
# 다른 파일에서 `from app.core.config import settings` 로 임포트해서 사용
settings = Settings()
