from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.collection import Collection, CollectionPersona
from app.models.persona import Persona
from app.models.user import User
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse, CollectionDetailResponse,
)
from app.schemas.persona import PersonaListResponse
from app.api.v1.endpoints.admin import require_admin

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.get("", response_model=list[CollectionResponse])
async def get_collections(db: AsyncSession = Depends(get_db)):
    """전체 컬렉션 목록을 반환합니다 (is_featured 여부 무관)."""
    result = await db.execute(
        select(Collection).order_by(Collection.created_at.desc())
    )
    collections = result.scalars().all()

    out = []
    for col in collections:
        count_result = await db.execute(
            select(func.count()).select_from(CollectionPersona).where(CollectionPersona.collection_id == col.id)
        )
        count = count_result.scalar() or 0
        out.append(CollectionResponse(
            id=col.id,
            title=col.title,
            description=col.description,
            emoji=col.emoji,
            is_featured=col.is_featured,
            persona_count=count,
            created_at=col.created_at,
        ))
    return out

@router.get("/{collection_id}", response_model=CollectionDetailResponse)
async def get_collection(collection_id: int, db: AsyncSession = Depends(get_db)):
    """특정 컬렉션과 그 안의 페르소나 목록을 반환합니다."""
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    col = result.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없어요.")

    cp_result = await db.execute(
        select(Persona)
        .join(CollectionPersona, CollectionPersona.persona_id == Persona.id)
        .where(CollectionPersona.collection_id == collection_id)
        .options(selectinload(Persona.user))
        .order_by(CollectionPersona.added_at.desc())
    )
    personas = cp_result.scalars().all()

    return CollectionDetailResponse(
        id=col.id,
        title=col.title,
        description=col.description,
        emoji=col.emoji,
        is_featured=col.is_featured,
        created_at=col.created_at,
        personas=[PersonaListResponse.model_validate(p) for p in personas],
    )

@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    col = Collection(**data.model_dump())
    db.add(col)
    await db.flush()
    await db.refresh(col)
    await db.commit()
    return CollectionResponse(
        id=col.id, title=col.title, description=col.description,
        emoji=col.emoji, is_featured=col.is_featured, persona_count=0,
        created_at=col.created_at,
    )

@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    col = result.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없어요.")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(col, field, value)
    await db.flush()
    await db.refresh(col)
    await db.commit()

    count_result = await db.execute(
        select(func.count()).select_from(CollectionPersona).where(CollectionPersona.collection_id == col.id)
    )
    count = count_result.scalar() or 0

    return CollectionResponse(
        id=col.id, title=col.title, description=col.description,
        emoji=col.emoji, is_featured=col.is_featured, persona_count=count,
        created_at=col.created_at,
    )

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    col = result.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없어요.")
    await db.delete(col)
    await db.commit()

@router.post("/{collection_id}/personas/{persona_id}", status_code=status.HTTP_201_CREATED)
async def add_persona_to_collection(
    collection_id: int,
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """컬렉션에 페르소나를 추가합니다."""
    col_result = await db.execute(select(Collection).where(Collection.id == collection_id))
    if not col_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없어요.")

    p_result = await db.execute(select(Persona).where(Persona.id == persona_id))
    if not p_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="페르소나를 찾을 수 없어요.")

    cp_result = await db.execute(
        select(CollectionPersona).where(
            CollectionPersona.collection_id == collection_id,
            CollectionPersona.persona_id == persona_id,
        )
    )
    if cp_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 컬렉션에 있는 페르소나입니다.")

    cp = CollectionPersona(collection_id=collection_id, persona_id=persona_id)
    db.add(cp)
    await db.commit()
    return {"ok": True}

@router.delete("/{collection_id}/personas/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_persona_from_collection(
    collection_id: int,
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """컬렉션에서 페르소나를 제거합니다."""
    await db.execute(
        delete(CollectionPersona).where(
            CollectionPersona.collection_id == collection_id,
            CollectionPersona.persona_id == persona_id,
        )
    )
    await db.commit()
