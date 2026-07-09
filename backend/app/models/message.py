from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Message(Base):
    """
    messages 테이블 — 대화 내용(말풍선) 하나하나를 저장.
    비유: 카카오톡 채팅방 안의 각 말풍선.
         누가 보냈고(role), 뭐라고 했는지(content), 언제(created_at).
    """

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False,
        index=True,
    )

    role = Column(
        String(20),
        nullable=False,
    )

    content = Column(
        Text,
        nullable=False,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):

        preview = self.content[:20] + "..." if len(self.content) > 20 else self.content
        return f"<Message id={self.id} role={self.role} content='{preview}'>"
