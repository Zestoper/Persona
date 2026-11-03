from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LoreEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    keywords: Optional[str] = Field(None, max_length=300)
    content: str = Field(..., min_length=1, max_length=2000)
    always_on: bool = False


class LoreEntryCreate(LoreEntryBase):
    pass


class LoreEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    keywords: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    always_on: Optional[bool] = None


class LoreEntryResponse(LoreEntryBase):
    id: int
    persona_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LorePreviewRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class LorePreviewResponse(BaseModel):
    selected: list[LoreEntryResponse]
