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

    KAKAO_CLIENT_ID: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/kakao/callback"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:

        env_file = ".env"

        case_sensitive = False

settings = Settings()
