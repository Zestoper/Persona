from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    emoji = Column(String(10), nullable=True, default="📚")
    is_featured = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    collection_personas = relationship("CollectionPersona", back_populates="collection", cascade="all, delete-orphan")


class CollectionPersona(Base):
    """페르소나-컬렉션 N:M 연결 테이블."""
    __tablename__ = "collection_personas"

    collection_id = Column(Integer, ForeignKey("collections.id"), primary_key=True)
    persona_id = Column(Integer, ForeignKey("personas.id"), primary_key=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    collection = relationship("Collection", back_populates="collection_personas")
    persona = relationship("Persona")
