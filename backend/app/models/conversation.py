from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Conversation(Base):
    """
    conversations 테이블 — '대화방' 단위로 기록을 묶는 테이블.
    비유: 카카오톡 채팅방. 방 자체의 정보(누가, 어느 캐릭터와, 언제 시작했나).
         실제 대화 내용(말풍선들)은 messages 테이블에 따로 저장.

    왜 conversations와 messages를 분리했나?
    → 하나의 대화방에서 수백 개의 메시지가 쌓일 수 있기 때문.
      방 정보(conversations)와 메시지(messages)를 분리해야 효율적으로 조회 가능.
    """

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="conversations")
    persona = relationship("Persona", back_populates="conversations")

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation id={self.id} user={self.user_id} persona={self.persona_id}>"
