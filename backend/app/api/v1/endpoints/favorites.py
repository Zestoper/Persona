from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.database import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.models.persona import Persona
from app.core.security import get_current_user
from app.schemas.persona import PersonaListResponse

router = APIRouter(prefix="/favorites", tags=["Favorites"])


# ── 즐겨찾기 토글 (추가 or 제거) ──────────────────────────
# POST /api/v1/favorites/{persona_id}
@router.post("/{persona_id}")
async def toggle_favorite(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.persona_id == persona_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        await db.commit()
        return {"persona_id": persona_id, "is_favorited": False}
    else:
        db.add(Favorite(user_id=current_user.id, persona_id=persona_id))
        await db.commit()
        return {"persona_id": persona_id, "is_favorited": True}


# ── 내 즐겨찾기 목록 조회 ─────────────────────────────────
# GET /api/v1/favorites
@router.get("", response_model=list[PersonaListResponse])
async def get_my_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Persona)
        .join(Favorite, Favorite.persona_id == Persona.id)
        .where(Favorite.user_id == current_user.id)
        .where(Persona.is_public == True)  # noqa: E712
    )
    return list(result.scalars().all())


# ── 즐겨찾기한 persona_id 목록 ────────────────────────────
# GET /api/v1/favorites/ids
@router.get("/ids")
async def get_favorite_ids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Favorite.persona_id).where(Favorite.user_id == current_user.id)
    )
    return {"ids": list(result.scalars().all())}
