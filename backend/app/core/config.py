from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    앱 전체에서 사용하는 설정값을 한 곳에 모아둔 클래스.
    비유: 앱의 '설정 메뉴' 화면 — 여기서 한 번만 바꾸면 전체에 적용됨.
    """

    APP_NAME: str = "AI 페르소나 챗봇 빌더"
    DEBUG: bool = True

    DATABASE_URL: str

    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    ALGORITHM: str = "HS256"

    GROQ_API_KEY: str
    CEREBRAS_API_KEY: str = ""

    # 소셜 로그인 (구글 · 카카오) — app/api/v1/endpoints/oauth.py
    BACKEND_URL: str = ""            # 이 서버 주소. 비우면 Render 주소 → http://localhost:8000 순으로 잡는다
    FRONTEND_URL: str = "http://localhost:5173"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    KAKAO_REST_API_KEY: str = ""
    KAKAO_CLIENT_SECRET: str = ""    # 카카오 콘솔에서 Client Secret 을 '사용'으로 켰을 때만
    # 아래 3개는 예전 소셜 로그인 설정 — 이제 쓰지 않는다 (콜백 주소는 BACKEND_URL 로 만든다).
    # .env 에 남아 있어도 서버가 뜨도록 자리만 둔다. KAKAO_CLIENT_ID 는 KAKAO_REST_API_KEY 가 비었을 때만 대신 쓴다.
    KAKAO_CLIENT_ID: str = ""
    KAKAO_REDIRECT_URI: str = ""
    GOOGLE_REDIRECT_URI: str = ""

    # 메일 발송 (비밀번호 재설정) — Brevo API
    BREVO_API_KEY: str = ""
    MAIL_FROM: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:

        env_file = ".env"

        case_sensitive = False

settings = Settings()
