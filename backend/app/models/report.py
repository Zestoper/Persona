# ── 임포트 ────────────────────────────────────────────────
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

    # ── 신고한 사람 ────────────────────────────────────────
    reporter_id = Column(
        Integer,
        ForeignKey("users.id"),   # users 테이블의 id 참조
        nullable=False,
    )

    # ── 신고 당한 페르소나 ────────────────────────────────
    persona_id = Column(
        Integer,
        ForeignKey("personas.id"),  # personas 테이블의 id 참조
        nullable=False,
        index=True,   # "이 캐릭터에 대한 모든 신고" 조회용 인덱스
    )

    # ── 신고 사유 (카테고리) ───────────────────────────────
    # 예: "욕설", "성인물", "혐오발언", "스팸", "기타"
    reason = Column(
        String(50),    # 신고 카테고리 코드 (짧은 문자열)
        nullable=False,
    )

    # ── 신고 상세 내용 ────────────────────────────────────
    description = Column(
        Text,          # 신고자가 직접 쓰는 추가 설명
        nullable=True, # 상세 내용은 선택 입력
    )

    # ── 처리 상태 ─────────────────────────────────────────
    # "pending"  : 검토 대기 중 (기본값)
    # "resolved" : 처리 완료
    # "rejected" : 신고 기각
    status = Column(
        String(20),
        default="pending",
        nullable=False,
    )

    # ── 신고 시간 ─────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # ── 관계 설정 ──────────────────────────────────────────
    persona = relationship("Persona", back_populates="reports")
    # reporter는 User와의 관계지만 User 모델을 단순하게 유지하기 위해 여기서만 참조
    reporter = relationship("User", foreign_keys=[reporter_id])

    def __repr__(self):
        return f"<Report id={self.id} persona={self.persona_id} reason={self.reason} status={self.status}>"
