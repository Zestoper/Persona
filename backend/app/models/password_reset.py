from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.db.database import Base


class PasswordReset(Base):
    """
    password_resets 테이블 — 비밀번호 재설정 링크.
    링크에 들어가는 토큰 원문은 메일로만 보내고 여기에는 SHA-256 해시만 저장한다.
    (DB가 유출돼도 해시로는 재설정 링크를 만들 수 없음)
    """

    __tablename__ = "password_resets"

    token_hash = Column(String(64), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
