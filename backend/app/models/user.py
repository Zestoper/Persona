from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    """
    users 테이블 — 회원 정보를 저장하는 테이블.
    비유: 헬스장 회원 카드. 이름, 연락처, 가입일이 적혀있음.
    """

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(
        String(255),
        nullable=False,
    )

    nickname = Column(
        String(50),
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_admin = Column(
        Boolean,
        default=False,
        nullable=False,
        server_default="false",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):

        return f"<User id={self.id} email={self.email}>"
