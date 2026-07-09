from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Report(Base):
    """
    reports 테이블 — 부적절한 페르소나 신고 내역.
    비유: 유튜브 영상의 '신고하기' 기록.
         누가(reporter_id), 어느 캐릭터를(persona_id), 왜 신고했나(reason).
    """

    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    reporter_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),
        nullable=False,
        index=True,
    )

    reason = Column(
        String(50),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(20),
        default="pending",
        nullable=False,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    persona = relationship("Persona", back_populates="reports")

    reporter = relationship("User", foreign_keys=[reporter_id])

    def __repr__(self):
        return f"<Report id={self.id} persona={self.persona_id} reason={self.reason} status={self.status}>"
