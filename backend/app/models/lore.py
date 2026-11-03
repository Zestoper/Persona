from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class LoreEntry(Base):
    """
    lore_entries 테이블 — 캐릭터 설정집 항목 (세계관 · 인물 관계 · 과거 사건 · 장소 등).

    시스템 프롬프트에 설정을 전부 넣으면 길어질수록 토큰이 늘고 모델이 앞부분을 놓친다.
    설정집은 항목별로 저장해 두고 대화에 관련된 항목만 골라 넣는다 (services/lorebook.py).
    """

    __tablename__ = "lore_entries"

    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey("personas.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(100), nullable=False)          # 예: "여동생 하린"
    keywords = Column(String(300), nullable=True)        # 이 단어가 대화에 나오면 반드시 넣기 (쉼표 구분)
    content = Column(Text, nullable=False)               # 설정 내용 (최대 2000자)
    always_on = Column(Boolean, nullable=False, default=False, server_default="false")  # 항상 넣기 (핵심 세계관)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
