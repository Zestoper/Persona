# ── 임포트 ────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc  # desc/asc: 내림차순/오름차순 정렬
from fastapi import HTTPException, status

from app.models.persona import Persona
from app.models.user import User
from app.schemas.persona import PersonaCreate, PersonaUpdate


# ── System Prompt 자동 생성 함수 ───────────────────────────
def build_system_prompt(
    name: str,
    personality: str,
    background: str | None,
    speech_style: str | None,
) -> str:
    """
    사용자가 입력한 캐릭터 정보를 Claude/Groq에 전달할 System Prompt로 변환.
    비유: 배우에게 주는 '연기 지침서'. AI가 이 텍스트를 읽고 캐릭터처럼 행동함.
    """
    # ── 기본 정체성 설정 ───────────────────────────────────
    prompt = f"당신은 '{name}'입니다.\n\n"

    # ── 성격 추가 ──────────────────────────────────────────
    prompt += f"[성격]\n{personality}\n\n"

    # ── 배경스토리 추가 (있을 때만) ────────────────────────
    if background:
        prompt += f"[배경스토리]\n{background}\n\n"

    # ── 말투 추가 (있을 때만) ──────────────────────────────
    if speech_style:
        prompt += f"[말투]\n{speech_style}\n\n"

    # ── 공통 행동 지침 ─────────────────────────────────────
    prompt += (
        "[행동 지침]\n"
        "- 항상 위의 캐릭터 설정에 맞게 대화하세요.\n"
        "- 절대로 AI임을 밝히거나, 캐릭터에서 벗어나지 마세요.\n"
        "- 자연스럽고 일관된 캐릭터를 유지하세요.\n"
        "- 사용자의 말에 공감하며 대화를 이어가세요.\n"
        "- 한자(漢字)는 절대 사용하지 마세요. 한국어로만 대화하세요."
    )

    return prompt


# ── 페르소나 생성 ──────────────────────────────────────────
async def create_persona(
    db: AsyncSession,
    persona_data: PersonaCreate,
    current_user: User,         # 현재 로그인한 사용자 (만든 사람)
) -> Persona:

    # ── System Prompt 자동 생성 ────────────────────────────
    system_prompt = build_system_prompt(
        name=persona_data.name,
        personality=persona_data.personality,
        background=persona_data.background,
        speech_style=persona_data.speech_style,
    )

    # ── Persona 객체 생성 ──────────────────────────────────
    new_persona = Persona(
        user_id=current_user.id,
        name=persona_data.name,
        personality=persona_data.personality,
        background=persona_data.background,
        speech_style=persona_data.speech_style,
        system_prompt=system_prompt,
        is_public=persona_data.is_public,
        avatar_url=persona_data.avatar_url,
        tags=persona_data.tags,
    )

    db.add(new_persona)          # INSERT 준비
    await db.flush()             # INSERT 실행 + id 채우기
    await db.refresh(new_persona)  # DB 최신 상태 반영 (created_at 등)

    return new_persona


# ── 내 페르소나 목록 조회 ──────────────────────────────────
async def get_my_personas(
    db: AsyncSession,
    current_user: User,
) -> list[Persona]:

    result = await db.execute(
        select(Persona)
        .where(Persona.user_id == current_user.id)  # 내 것만 필터
        .order_by(desc(Persona.created_at))          # 최신순 정렬
    )
    return list(result.scalars().all())  # 결과를 리스트로 변환


# ── 특정 페르소나 조회 ─────────────────────────────────────
async def get_persona_by_id(
    db: AsyncSession,
    persona_id: int,
    current_user: User | None = None,  # None이면 공개 페르소나만 허용
) -> Persona:

    result = await db.execute(
        select(Persona).where(Persona.id == persona_id)
    )
    persona = result.scalar_one_or_none()

    # ── 존재하지 않는 페르소나 ────────────────────────────
    if not persona:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="페르소나를 찾을 수 없습니다.",
        )

    # ── 비공개 페르소나 접근 제한 ─────────────────────────
    # 비공개인데 로그인도 안 했거나, 내 것이 아니면 거부
    if not persona.is_public:
        if current_user is None or persona.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="비공개 페르소나입니다.",
            )

    return persona


# ── 페르소나 수정 ──────────────────────────────────────────
async def update_persona(
    db: AsyncSession,
    persona_id: int,
    update_data: PersonaUpdate,
    current_user: User,
) -> Persona:

    # ── 기존 페르소나 조회 (내 것인지 확인 포함) ──────────
    persona = await get_persona_by_id(db, persona_id, current_user)

    # ── 내 것이 아니면 거부 ────────────────────────────────
    if persona.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="내 페르소나만 수정할 수 있습니다.",
        )

    # ── 보내온 필드만 업데이트 (None이 아닌 것만) ──────────
    # model_dump(exclude_unset=True) : 실제로 보내온 필드만 딕셔너리로 반환
    # 비유: 수정 폼에서 이름만 바꾸면 이름만 업데이트, 나머지는 그대로
    update_fields = update_data.model_dump(exclude_unset=True)

    for field, value in update_fields.items():
        setattr(persona, field, value)  # persona.name = "새이름" 형식으로 업데이트

    # ── 캐릭터 정보가 바뀌었으면 System Prompt도 재생성 ───
    if any(f in update_fields for f in ["name", "personality", "background", "speech_style"]):
        persona.system_prompt = build_system_prompt(
            name=persona.name,
            personality=persona.personality,
            background=persona.background,
            speech_style=persona.speech_style,
        )

    await db.flush()
    await db.refresh(persona)

    return persona


# ── 페르소나 삭제 ──────────────────────────────────────────
async def delete_persona(
    db: AsyncSession,
    persona_id: int,
    current_user: User,
) -> None:

    persona = await get_persona_by_id(db, persona_id, current_user)

    # ── 내 것이 아니면 거부 ────────────────────────────────
    if persona.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="내 페르소나만 삭제할 수 있습니다.",
        )

    await db.delete(persona)  # DELETE 실행 (cascade로 대화방, 메시지도 같이 삭제)
    await db.flush()


# ── 공개 페르소나 목록 (마켓플레이스) ─────────────────────
async def fork_persona(
    db: AsyncSession,
    persona_id: int,
    current_user: User,
) -> Persona:
    """공개 페르소나를 내 계정으로 복사."""
    original = await get_persona_by_id(db, persona_id, current_user=None)
    if not original.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="공개 페르소나만 복사할 수 있습니다.",
        )
    new_persona = Persona(
        user_id=current_user.id,
        name=f"{original.name} (복사)",
        personality=original.personality,
        background=original.background,
        speech_style=original.speech_style,
        system_prompt=original.system_prompt,
        is_public=False,
        avatar_url=original.avatar_url,
        tags=original.tags,
    )
    db.add(new_persona)
    await db.flush()
    await db.refresh(new_persona)
    return new_persona


async def get_public_personas(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    sort: str = "popular",  # "popular" | "latest"
    search: str = "",
    tag: str = "",          # 태그 필터
) -> list[Persona]:

    order = desc(Persona.created_at) if sort == "latest" else desc(Persona.chat_count)

    query = select(Persona).where(Persona.is_public == True)  # noqa: E712
    if search.strip():
        query = query.where(Persona.name.ilike(f"%{search.strip()}%"))
    if tag.strip():
        # tags 컬럼에 해당 태그가 포함되는지 확인 (예: "친구,힐링" 에서 "친구" 검색)
        query = query.where(Persona.tags.ilike(f"%{tag.strip()}%"))

    result = await db.execute(query.order_by(order).offset(skip).limit(limit))
    return list(result.scalars().all())
