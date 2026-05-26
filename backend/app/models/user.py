# ── SQLAlchemy에서 필요한 도구들 임포트 ────────────────────
from sqlalchemy import Column, Integer, String, Boolean, DateTime  # 열(컬럼) 타입들
from sqlalchemy.orm import relationship   # 다른 테이블과의 '관계' 설정 도구
from sqlalchemy.sql import func           # SQL 함수 모음 (예: now(), count())
from app.db.database import Base          # 모든 모델의 부모 클래스


class User(Base):
    """
    users 테이블 — 회원 정보를 저장하는 테이블.
    비유: 헬스장 회원 카드. 이름, 연락처, 가입일이 적혀있음.
    """

    # ── 테이블 이름 지정 ───────────────────────────────────
    __tablename__ = "users"  # DB에서 실제로 만들어질 테이블 이름

    # ── 컬럼 정의 ─────────────────────────────────────────
    # Column(타입, 옵션들) 형식으로 작성

    id = Column(
        Integer,        # 정수형 타입
        primary_key=True,  # 기본키 — 각 행을 유일하게 구분하는 번호 (주민번호 역할)
        index=True,     # 이 컬럼으로 자주 검색하니까 인덱스 생성 (책의 '찾아보기' 같은 것)
    )

    email = Column(
        String(255),    # 최대 255자 문자열
        unique=True,    # 중복 불가 — 같은 이메일로 두 번 가입 못 함
        nullable=False, # NULL 불가 — 이메일 없이는 가입 못 함
        index=True,     # 로그인 시 이메일로 검색하니까 인덱스 추가
    )

    password = Column(
        String(255),    # bcrypt 암호화된 비밀번호 (암호화하면 60자 이상)
        nullable=False, # 비밀번호 없이는 가입 못 함
    )

    nickname = Column(
        String(50),     # 최대 50자 (너무 긴 닉네임 방지)
        nullable=False, # 닉네임 필수
    )

    is_active = Column(
        Boolean,        # True/False 값
        default=True,   # 가입하면 기본으로 활성 상태
        nullable=False,
    )

    is_admin = Column(
        Boolean,
        default=False,  # 기본값: 일반 유저
        nullable=False,
        server_default="false",
    )

    created_at = Column(
        DateTime(timezone=True),     # 시간대 정보 포함한 날짜+시간
        server_default=func.now(),   # INSERT 시 DB 서버 시간으로 자동 입력
        nullable=False,
    )

    # ── 관계 설정 (relationship) ───────────────────────────
    # 비유: User 객체에서 .personas 하면 그 사람이 만든 캐릭터 목록이 자동으로 나옴
    # back_populates : 반대쪽 모델(Persona)에서도 .user 로 접근 가능하게 연결
    personas = relationship("Persona", back_populates="user", cascade="all, delete-orphan")
    # cascade="all, delete-orphan" : 회원 삭제 시 그 사람의 페르소나도 같이 삭제

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        # 터미널에서 User 객체를 print할 때 보여줄 문자열 (디버깅용)
        return f"<User id={self.id} email={self.email}>"
