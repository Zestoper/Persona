# ── 임포트 ────────────────────────────────────────────────
from pydantic import BaseModel, field_validator
from datetime import datetime


# ── 페르소나 생성 요청 스키마 ──────────────────────────────
# 사용자가 폼에서 입력하는 값들
class PersonaCreate(BaseModel):
    name: str              # 캐릭터 이름 (예: "민준이")
    personality: str       # 성격 설명 (예: "밝고 에너지 넘치는 성격")
    background: str | None = None    # 배경스토리 (선택)
    speech_style: str | None = None  # 말투 (예: "친근한 반말")
    is_public: bool = False          # 공개 여부 (기본: 비공개)
    avatar_url: str | None = None    # 아바타 이미지 URL (선택)

    # ── 이름 검증 ─────────────────────────────────────────
    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: str) -> str:
        v = v.strip()           # 앞뒤 공백 제거
        if len(v) < 1:
            raise ValueError("캐릭터 이름을 입력해주세요.")
        if len(v) > 50:
            raise ValueError("캐릭터 이름은 50자 이하여야 합니다.")
        return v

    # ── 성격 검증 ─────────────────────────────────────────
    @field_validator("personality")
    @classmethod
    def personality_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("성격 설명을 10자 이상 입력해주세요.")
        return v


# ── 페르소나 수정 요청 스키마 ──────────────────────────────
# 수정 시 보내지 않은 필드는 기존 값 유지 → 모든 필드 Optional
class PersonaUpdate(BaseModel):
    name: str | None = None
    personality: str | None = None
    background: str | None = None
    speech_style: str | None = None
    is_public: bool | None = None
    avatar_url: str | None = None


# ── 페르소나 응답 스키마 ───────────────────────────────────
# API가 돌려줄 데이터 형식 (system_prompt는 내부용이라 포함하지 않아도 됨)
class PersonaResponse(BaseModel):
    id: int
    user_id: int           # 만든 사람 id
    name: str
    personality: str
    background: str | None
    speech_style: str | None
    system_prompt: str     # 생성된 system prompt 확인용으로 포함
    is_public: bool
    chat_count: int
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy 모델 → Pydantic 자동 변환


# ── 목록 응답 스키마 ───────────────────────────────────────
# 목록 조회 시 간략한 정보만 반환 (system_prompt 같은 긴 내용 제외)
class PersonaListResponse(BaseModel):
    id: int
    user_id: int
    name: str
    personality: str
    speech_style: str | None
    is_public: bool
    chat_count: int
    avatar_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True
