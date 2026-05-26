from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.persona import Persona
from app.core.security import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/conversations", tags=["Conversations"])


class ConversationListItem(BaseModel):
    id: int
    persona_id: int
    persona_name: str
    persona_avatar_url: str | None
    last_message: str | None
    last_message_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/me", response_model=list[ConversationListItem])
async def get_my_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """내 대화 목록을 최신 메시지 기준으로 반환합니다."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .options(
            selectinload(Conversation.persona),
            selectinload(Conversation.messages),
        )
        .order_by(desc(Conversation.created_at))
    )
    conversations = result.scalars().all()

    items = []
    for conv in conversations:
        sorted_msgs = sorted(conv.messages, key=lambda m: m.created_at)
        last_msg = sorted_msgs[-1] if sorted_msgs else None
        items.append(ConversationListItem(
            id=conv.id,
            persona_id=conv.persona_id,
            persona_name=conv.persona.name if conv.persona else "삭제된 캐릭터",
            persona_avatar_url=conv.persona.avatar_url if conv.persona else None,
            last_message=last_msg.content[:80] if last_msg else None,
            last_message_at=last_msg.created_at if last_msg else None,
            created_at=conv.created_at,
        ))

    items.sort(key=lambda x: x.last_message_at or x.created_at, reverse=True)
    return items
