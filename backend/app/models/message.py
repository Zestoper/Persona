# ── 임포트 ────────────────────────────────────────────────
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

    # ── 어느 대화방의 메시지인가 ───────────────────────────
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),  # conversations 테이블의 id 참조
        nullable=False,
        index=True,   # "이 대화방의 모든 메시지" 조회가 잦으니 인덱스 추가
    )

    # ── 보낸 사람 구분 ─────────────────────────────────────
    # Claude API의 메시지 형식에 맞춤: "user" 또는 "assistant"
    # - "user"      : 사람이 보낸 메시지
    # - "assistant" : AI(Claude)가 보낸 메시지
    # 비유: 카카오톡에서 내 말풍선(user) vs 상대방 말풍선(assistant)
    role = Column(
        String(20),    # "user" 또는 "assistant" 둘 다 20자 이하
        nullable=False,
    )

    # ── 메시지 내용 ────────────────────────────────────────
    content = Column(
        Text,          # 메시지 길이 제한 없음 (AI 답변은 길 수 있음)
        nullable=False,
    )

    # ── 메시지 전송 시간 ───────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ── 관계 설정 ──────────────────────────────────────────
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        # content 앞 20자만 보여줌 (긴 메시지를 전부 출력하면 지저분함)
        preview = self.content[:20] + "..." if len(self.content) > 20 else self.content
        return f"<Message id={self.id} role={self.role} content='{preview}'>"
