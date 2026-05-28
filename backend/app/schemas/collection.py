from pydantic import BaseModel
from datetime import datetime
from app.schemas.persona import PersonaListResponse


class CollectionCreate(BaseModel):
    title: str
    description: str | None = None
    emoji: str | None = "📚"
    is_featured: bool = True


class CollectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    emoji: str | None = None
    is_featured: bool | None = None


class CollectionResponse(BaseModel):
    id: int
    title: str
    description: str | None
    emoji: str | None
    is_featured: bool
    persona_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class CollectionDetailResponse(BaseModel):
    id: int
    title: str
    description: str | None
    emoji: str | None
    is_featured: bool
    created_at: datetime
    personas: list[PersonaListResponse]

    class Config:
        from_attributes = True
