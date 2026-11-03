"""캐릭터 설정집 API — 만든 사람만 보고 고칠 수 있다 (시스템 프롬프트와 같은 취급)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.lore import LoreEntry
from app.models.persona import Persona
from app.models.user import User
from app.schemas.lore import (
    LoreEntryCreate, LoreEntryResponse, LoreEntryUpdate, LorePreviewRequest, LorePreviewResponse,
)
from app.services.lorebook import select_entries

router = APIRouter(prefix="/personas/{persona_id}/lore", tags=["Lorebook"])

MAX_ENTRIES_PER_PERSONA = 50


async def _own_persona(db: AsyncSession, persona_id: int, user: User) -> Persona:
    persona = await db.get(Persona, persona_id)
    if not persona:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="페르소나를 찾을 수 없습니다.")
    if persona.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인 캐릭터의 설정집만 볼 수 있습니다.")
    return persona


async def _own_entry(db: AsyncSession, persona_id: int, entry_id: int, user: User) -> LoreEntry:
    await _own_persona(db, persona_id, user)
    entry = await db.get(LoreEntry, entry_id)
    if not entry or entry.persona_id != persona_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="설정 항목을 찾을 수 없습니다.")
    return entry


@router.get("", response_model=list[LoreEntryResponse])
async def list_lore(persona_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    await _own_persona(db, persona_id, user)
    rows = await db.execute(select(LoreEntry).where(LoreEntry.persona_id == persona_id).order_by(LoreEntry.id))
    return rows.scalars().all()


@router.post("", response_model=LoreEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_lore(persona_id: int, body: LoreEntryCreate, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    await _own_persona(db, persona_id, user)
    count = await db.scalar(select(func.count()).select_from(LoreEntry).where(LoreEntry.persona_id == persona_id))
    if (count or 0) >= MAX_ENTRIES_PER_PERSONA:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"설정집은 캐릭터당 {MAX_ENTRIES_PER_PERSONA}개까지예요.")
    entry = LoreEntry(persona_id=persona_id, **body.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=LoreEntryResponse)
async def update_lore(persona_id: int, entry_id: int, body: LoreEntryUpdate, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    entry = await _own_entry(db, persona_id, entry_id, user)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(entry, k, v)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lore(persona_id: int, entry_id: int, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    entry = await _own_entry(db, persona_id, entry_id, user)
    await db.delete(entry)
    await db.commit()


@router.post("/preview", response_model=LorePreviewResponse)
async def preview_lore(persona_id: int, body: LorePreviewRequest, db: AsyncSession = Depends(get_db),
                       user: User = Depends(get_current_user)):
    """'이 메시지를 보내면 어떤 설정이 들어가는지' 크리에이터가 미리 확인 (AI 호출 없음)."""
    await _own_persona(db, persona_id, user)
    rows = await db.execute(select(LoreEntry).where(LoreEntry.persona_id == persona_id))
    return {"selected": select_entries(list(rows.scalars().all()), body.message)}
