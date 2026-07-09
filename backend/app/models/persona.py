from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Persona(Base):
    """
    personas 테이블 — 사용자가 만든 AI 캐릭터 정보.
    비유: 롤플레이 게임의 캐릭터 카드.
         이름, 성격, 배경스토리가 적혀있고 누가 만들었는지도 표시됨.
    """

    __tablename__ = "personas"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),

        nullable=False,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    personality = Column(
        Text,
        nullable=False,
    )

    background = Column(
        Text,
        nullable=True,
    )

    speech_style = Column(
        String(200),
        nullable=True,
    )

    system_prompt = Column(
        Text,
        nullable=False,
    )

    is_public = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    chat_count = Column(
        Integer,
        default=0,
        nullable=False,
    )

    tags = Column(
        String(500),
        nullable=True,
    )

    avatar_url = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="personas")

    conversations = relationship("Conversation", back_populates="persona", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="persona", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="persona", cascade="all, delete-orphan")

    @property
    def creator_nickname(self) -> str | None:
        return self.user.nickname if self.user else None

    def __repr__(self):
        return f"<Persona id={self.id} name={self.name} owner={self.user_id}>"
