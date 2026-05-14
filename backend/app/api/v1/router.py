# ── 임포트 ────────────────────────────────────────────────
from fastapi import APIRouter               # 라우터 클래스
from app.api.v1.endpoints import auth       # auth 엔드포인트 모듈
from app.api.v1.endpoints import personas   # personas 엔드포인트 모듈
from app.api.v1.endpoints import chat       # chat 엔드포인트 모듈


# ── v1 통합 라우터 ─────────────────────────────────────────
# 비유: 백화점 안내데스크. "auth 관련은 1층, persona 관련은 2층"처럼 경로를 분배.
api_router = APIRouter()

# auth 라우터 연결
# prefix="/auth"는 auth.router 안에 이미 있지만,
# 여기서 한 번 더 그룹화해서 나중에 /api/v1 prefix를 main.py에서 한 번만 붙이면 됨
api_router.include_router(auth.router)
api_router.include_router(personas.router)
api_router.include_router(chat.router)
