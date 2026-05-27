# ── 임포트 ────────────────────────────────────────────────
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
# Text      : 길이 제한 없는 문자열 (system prompt는 길 수 있어서 Text 사용)
# ForeignKey: 다른 테이블의 컬럼을 참조하는 외래키

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Persona(Base):
    """
    personas 테이블 — 사용자가 만든 AI 캐릭터 정보.
    비유: 롤플레이 게임의 캐릭터 카드.
         이름, 성격, 배경스토리가 적혀있고 누가 만들었는지도 표시됨.
    """

    __tablename__ = "personas"  # DB 테이블 이름

    # ── 기본 식별자 ────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    # ── 외래키 — "이 캐릭터는 누가 만들었나" ──────────────
    user_id = Column(
        Integer,
        ForeignKey("users.id"),  # users 테이블의 id를 참조
        # "users.id" → 테이블이름.컬럼이름 형식
        nullable=False,          # 만든 사람 없는 캐릭터는 없음
    )

    # ── 캐릭터 기본 정보 ───────────────────────────────────
    name = Column(
        String(100),   # 캐릭터 이름 최대 100자
        nullable=False,
    )

    personality = Column(
        Text,          # 성격 설명 (길이 제한 없음)
        nullable=False,
    )

    background = Column(
        Text,          # 배경스토리 (길이 제한 없음)
        nullable=True, # 배경스토리는 선택 입력 (없어도 됨)
    )

    speech_style = Column(
        String(200),   # 말투 설명 (예: "반말로 친근하게", "존댓말로 정중하게")
        nullable=True,
    )

    # ── 핵심: Claude API에 전달할 System Prompt ────────────
    # 비유: 배우에게 주는 대본 + 연기 지침서.
    #       "너는 이런 캐릭터야. 이렇게 말해." 를 AI에게 전달하는 텍스트.
    system_prompt = Column(
        Text,          # 프롬프트는 길 수 있어서 Text 사용
        nullable=False,
    )

    # ── 공개 설정 ──────────────────────────────────────────
    is_public = Column(
        Boolean,
        default=False,  # 기본값: 비공개 (마켓플레이스에 바로 노출 안 됨)
        nullable=False,
    )

    # ── 통계 ───────────────────────────────────────────────
    chat_count = Column(
        Integer,
        default=0,     # 처음엔 대화 수 0
        nullable=False,
    )

    # ── 아바타 이미지 URL ──────────────────────────────────
    tags = Column(
        String(500),
        nullable=True,
    )

    avatar_url = Column(
        String(500),
        nullable=True,
    )

    # ── 시간 정보 ──────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),  # 생성 시 현재 시간
        onupdate=func.now(),        # UPDATE 될 때마다 자동으로 현재 시간으로 갱신
        nullable=False,
    )

    # ── 관계 설정 ──────────────────────────────────────────
    user = relationship("User", back_populates="personas")
    # .user → 이 페르소나를 만든 User 객체에 접근 가능

    conversations = relationship("Conversation", back_populates="persona", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="persona", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="persona", cascade="all, delete-orphan")

    @property
    def creator_nickname(self) -> str | None:
        return self.user.nickname if self.user else None

    def __repr__(self):
        return f"<Persona id={self.id} name={self.name} owner={self.user_id}>"
