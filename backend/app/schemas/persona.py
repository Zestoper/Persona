import re
from pydantic import BaseModel, field_validator
from datetime import datetime

# 한자·히라가나·가타카나 등 허용하지 않는 문자 범위
_HANJA_RE = re.compile(
    r"[一-鿿"   # CJK Unified Ideographs (한자)
    r"㐀-䶿"    # CJK Extension A
    r"぀-ゟ"    # Hiragana
    r"゠-ヿ"    # Katakana
    r"豈-﫿"    # CJK Compatibility Ideographs
    r"]"
)

def _check_no_hanja(v: str) -> str:
    m = _HANJA_RE.search(v)
    if m:
        raise ValueError(f"한자·일본어 문자는 사용할 수 없어요. (감지된 문자: '{m.group()}')")
    return v


class PersonaCreate(BaseModel):
    name: str
    personality: str
    background: str | None = None
    speech_style: str | None = None
    is_public: bool = False
    avatar_url: str | None = None
    tags: str | None = None  # 쉼표 구분, 예: "친구,힐링"

    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("캐릭터 이름을 입력해주세요.")
        if len(v) > 50:
            raise ValueError("캐릭터 이름은 50자 이하여야 합니다.")
        return _check_no_hanja(v)

    @field_validator("personality")
    @classmethod
    def personality_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("성격 설명을 10자 이상 입력해주세요.")
        return _check_no_hanja(v)

    @field_validator("background", "speech_style", "tags")
    @classmethod
    def text_fields_no_hanja(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _check_no_hanja(v)


class PersonaUpdate(BaseModel):
    name: str | None = None
    personality: str | None = None
    background: str | None = None
    speech_style: str | None = None
    is_public: bool | None = None
    avatar_url: str | None = None
    tags: str | None = None

    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 1:
            raise ValueError("캐릭터 이름을 입력해주세요.")
        if len(v) > 50:
            raise ValueError("캐릭터 이름은 50자 이하여야 합니다.")
        return _check_no_hanja(v)

    @field_validator("personality")
    @classmethod
    def personality_must_be_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 10:
            raise ValueError("성격 설명을 10자 이상 입력해주세요.")
        return _check_no_hanja(v)

    @field_validator("background", "speech_style", "tags")
    @classmethod
    def text_fields_no_hanja(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _check_no_hanja(v)


class PersonaResponse(BaseModel):
    id: int
    user_id: int
    name: str
    personality: str
    background: str | None
    speech_style: str | None
    system_prompt: str
    is_public: bool
    chat_count: int
    avatar_url: str | None
    tags: str | None
    created_at: datetime
    updated_at: datetime
    creator_nickname: str | None = None
    auto_collections: list[str] = []  # 생성/수정 시 자동으로 추가된 컬렉션 이름 목록

    class Config:
        from_attributes = True


class PersonaListResponse(BaseModel):
    id: int
    user_id: int
    name: str
    personality: str
    background: str | None
    speech_style: str | None
    is_public: bool
    chat_count: int
    avatar_url: str | None
    tags: str | None
    created_at: datetime
    creator_nickname: str | None = None
    my_collections: list[str] = []  # 이 페르소나가 속한 컬렉션 이름 목록

    class Config:
        from_attributes = True


# ── 페르소나 자동 생성 스키마 ──────────────────────────────
class PersonaGenerateRequest(BaseModel):
    name: str
    hint: str | None = None  # 어떤 캐릭터인지 한줄 힌트


class PersonaGenerateResponse(BaseModel):
    personality: str
    background: str
    speech_style: str
