# ── 임포트 ────────────────────────────────────────────────
import uuid
import json
from pathlib import Path

from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from groq import AsyncGroq

from app.db.database import get_db
from app.models.user import User
from app.core.config import settings
from app.core.security import get_current_user, get_optional_user
from app.schemas.persona import (
    PersonaCreate, PersonaUpdate, PersonaResponse, PersonaListResponse,
    PersonaGenerateRequest, PersonaGenerateResponse,
)
from app.services import persona_service
from app.services.chat_service import _strip_foreign_scripts

AVATAR_DIR = Path(__file__).parent.parent.parent.parent / "static" / "avatars"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


# ── 라우터 생성 ────────────────────────────────────────────
router = APIRouter(prefix="/personas", tags=["Personas"])


# ── 1. 페르소나 생성 ────────────────────────────────────────
# POST /api/v1/personas
@router.post(
    "",
    response_model=PersonaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_persona(
    persona_data: PersonaCreate,                        # 요청 바디
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),     # JWT 인증 필수
):
    """
    새 AI 페르소나를 생성합니다.
    입력한 성격/말투/배경을 바탕으로 System Prompt를 자동 생성합니다.
    """
    return await persona_service.create_persona(db, persona_data, current_user)


# ── 2. 내 페르소나 목록 조회 ───────────────────────────────
# GET /api/v1/personas/me
# 주의: "/me"를 "/{id}" 보다 먼저 선언해야 함
# 이유: FastAPI는 위에서부터 경로를 매칭하는데,
#       "/{id}"가 먼저 있으면 "me"도 문자열 id로 인식해버림
@router.get("/me", response_model=list[PersonaListResponse])
async def get_my_personas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내가 만든 페르소나 목록을 최신순으로 반환합니다."""
    return await persona_service.get_my_personas(db, current_user)


# ── 3. 공개 페르소나 목록 (마켓플레이스) ──────────────────
# GET /api/v1/personas/public?skip=0&limit=20
@router.get("/public", response_model=list[PersonaListResponse])
async def get_public_personas(
    skip: int = 0,
    limit: int = 20,
    sort: str = "popular",
    search: str = "",
    tag: str = "",
    db: AsyncSession = Depends(get_db),
):
    return await persona_service.get_public_personas(db, skip=skip, limit=limit, sort=sort, search=search, tag=tag)


# ── 페르소나 자동 생성 (Groq AI로 성격/배경/말투 제안) ────
@router.post("/generate", response_model=PersonaGenerateResponse)
async def generate_persona_fields(
    data: PersonaGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    prompt = (
        f"이름: {data.name}\n"
        f"힌트: {data.hint or '없음'}\n\n"
        "위 정보로 AI 채팅 페르소나를 설계하세요. 반드시 아래 JSON만 반환하세요 (다른 텍스트 없이):\n"
        '{"personality": "성격을 2-3문장으로", "background": "배경스토리를 2-3문장으로", "speech_style": "말투를 10자 이내로"}'
    )
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 AI 캐릭터 설계 도우미입니다. "
                    "반드시 순수한 한국어(한글)로만 작성하세요. "
                    "한자(漢字), 중국어 간체/번체, 일본어 히라가나/가타카나, 아랍어 등 "
                    "한글과 영어 이외의 문자는 절대 사용하지 마세요. "
                    "JSON 형식만 반환하고 다른 설명은 쓰지 마세요."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=400,
        temperature=0.7,
    )
    text = response.choices[0].message.content or "{}"
    try:
        start, end = text.find("{"), text.rfind("}") + 1
        parsed = json.loads(text[start:end])
    except Exception:
        parsed = {}
    return PersonaGenerateResponse(
        personality=_strip_foreign_scripts(parsed.get("personality", "활기차고 긍정적인 성격의 친구같은 캐릭터")),
        background=_strip_foreign_scripts(parsed.get("background", "평범한 일상을 보내며 새로운 경험을 즐기는 사람")),
        speech_style=_strip_foreign_scripts(parsed.get("speech_style", "친근한 반말")),
    )


# ── 4. 특정 페르소나 조회 ──────────────────────────────────
# GET /api/v1/personas/{persona_id}
@router.get("/{persona_id}", response_model=PersonaResponse)
async def get_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_optional_user),
):
    """
    특정 페르소나의 상세 정보를 반환합니다.
    비공개 페르소나는 본인만 조회 가능합니다.
    """
    return await persona_service.get_persona_by_id(db, persona_id, current_user)


# ── 5. 페르소나 수정 ────────────────────────────────────────
# PUT /api/v1/personas/{persona_id}
@router.put("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: int,
    update_data: PersonaUpdate,   # 수정할 필드만 보내면 됨 (나머지는 기존 값 유지)
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    페르소나 정보를 수정합니다.
    본인 페르소나만 수정 가능합니다.
    성격/말투/배경이 바뀌면 System Prompt도 자동으로 재생성됩니다.
    """
    return await persona_service.update_persona(db, persona_id, update_data, current_user)


# ── 6. 페르소나 삭제 ────────────────────────────────────────
# DELETE /api/v1/personas/{persona_id}
@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    페르소나를 삭제합니다.
    본인 페르소나만 삭제 가능합니다.
    삭제 시 관련 대화 기록도 함께 삭제됩니다 (cascade).
    성공 시 204 No Content (응답 바디 없음).
    """
    await persona_service.delete_persona(db, persona_id, current_user)


# ── 7. 페르소나 복사(포크) ─────────────────────────────────
# POST /api/v1/personas/{persona_id}/fork
@router.post("/{persona_id}/fork", response_model=PersonaResponse, status_code=status.HTTP_201_CREATED)
async def fork_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """공개 페르소나를 내 계정으로 복사합니다."""
    return await persona_service.fork_persona(db, persona_id, current_user)


# ── 8. 아바타 이미지 업로드 ────────────────────────────────
# POST /api/v1/personas/{persona_id}/avatar
@router.post("/{persona_id}/avatar", response_model=PersonaResponse)
async def upload_avatar(
    persona_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="jpg, png, webp, gif만 업로드 가능합니다.")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = AVATAR_DIR / filename

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB 제한
        raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다.")

    save_path.write_bytes(contents)

    avatar_url = f"/static/avatars/{filename}"
    return await persona_service.update_persona(
        db, persona_id, PersonaUpdate(avatar_url=avatar_url), current_user
    )
