from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.user import User
from app.models.persona import Persona
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.report import Report
from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="관리자만 접근할 수 있습니다.")
    return current_user


# ── 응답 스키마 ───────────────────────────────────────────

class StatsResponse(BaseModel):
    total_users: int
    total_personas: int
    total_conversations: int
    total_messages: int
    total_reports: int
    pending_reports: int


class AdminUserItem(BaseModel):
    id: int
    email: str
    nickname: str
    is_active: bool
    is_admin: bool
    persona_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AdminPersonaItem(BaseModel):
    id: int
    name: str
    user_id: int
    user_nickname: str
    is_public: bool
    chat_count: int
    tags: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminReportItem(BaseModel):
    id: int
    persona_id: int
    persona_name: str
    reporter_id: int
    reporter_nickname: str
    reason: str
    description: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReportStatusUpdate(BaseModel):
    status: str  # "resolved" | "rejected"


# ── 1. 통계 대시보드 ──────────────────────────────────────

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_personas = (await db.execute(select(func.count(Persona.id)))).scalar()
    total_conversations = (await db.execute(select(func.count(Conversation.id)))).scalar()
    total_messages = (await db.execute(select(func.count(Message.id)))).scalar()
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar()
    pending_reports = (await db.execute(select(func.count(Report.id)).where(Report.status == "pending"))).scalar()

    return StatsResponse(
        total_users=total_users or 0,
        total_personas=total_personas or 0,
        total_conversations=total_conversations or 0,
        total_messages=total_messages or 0,
        total_reports=total_reports or 0,
        pending_reports=pending_reports or 0,
    )


# ── 2. 유저 목록 ──────────────────────────────────────────

@router.get("/users", response_model=list[AdminUserItem])
async def get_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(User).order_by(desc(User.created_at)).offset(skip).limit(limit)
    )
    users = result.scalars().all()

    items = []
    for u in users:
        count_result = await db.execute(
            select(func.count(Persona.id)).where(Persona.user_id == u.id)
        )
        persona_count = count_result.scalar() or 0
        items.append(AdminUserItem(
            id=u.id, email=u.email, nickname=u.nickname,
            is_active=u.is_active, is_admin=u.is_admin,
            persona_count=persona_count, created_at=u.created_at,
        ))
    return items


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """유저 계정 활성/비활성화 토글."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="본인 계정은 변경할 수 없습니다.")
    user.is_active = not user.is_active
    await db.flush()
    return {"id": user.id, "is_active": user.is_active}


# ── 3. 페르소나 목록 ──────────────────────────────────────

@router.get("/personas", response_model=list[AdminPersonaItem])
async def get_all_personas(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(
        select(Persona).order_by(desc(Persona.created_at)).offset(skip).limit(limit)
    )
    personas = result.scalars().all()

    items = []
    for p in personas:
        user_result = await db.execute(select(User).where(User.id == p.user_id))
        owner = user_result.scalar_one_or_none()
        items.append(AdminPersonaItem(
            id=p.id, name=p.name, user_id=p.user_id,
            user_nickname=owner.nickname if owner else "탈퇴한 유저",
            is_public=p.is_public, chat_count=p.chat_count,
            tags=p.tags, created_at=p.created_at,
        ))
    return items


@router.delete("/personas/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
async def force_delete_persona(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """관리자 강제 삭제."""
    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="페르소나를 찾을 수 없습니다.")
    await db.delete(persona)
    await db.flush()


# ── 4. 신고 목록 ──────────────────────────────────────────

@router.get("/reports", response_model=list[AdminReportItem])
async def get_reports(
    status_filter: str = "",  # "" | "pending" | "resolved" | "rejected"
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = select(Report).order_by(desc(Report.created_at)).offset(skip).limit(limit)
    if status_filter:
        query = select(Report).where(Report.status == status_filter).order_by(desc(Report.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    reports = result.scalars().all()

    items = []
    for r in reports:
        persona_result = await db.execute(select(Persona).where(Persona.id == r.persona_id))
        persona = persona_result.scalar_one_or_none()
        reporter_result = await db.execute(select(User).where(User.id == r.reporter_id))
        reporter = reporter_result.scalar_one_or_none()
        items.append(AdminReportItem(
            id=r.id, persona_id=r.persona_id,
            persona_name=persona.name if persona else "삭제된 페르소나",
            reporter_id=r.reporter_id,
            reporter_nickname=reporter.nickname if reporter else "탈퇴한 유저",
            reason=r.reason, description=r.description,
            status=r.status, created_at=r.created_at,
        ))
    return items


@router.put("/reports/{report_id}", response_model=AdminReportItem)
async def update_report_status(
    report_id: int,
    data: ReportStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    if data.status not in ("resolved", "rejected"):
        raise HTTPException(status_code=400, detail="status는 resolved 또는 rejected여야 합니다.")

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="신고를 찾을 수 없습니다.")

    report.status = data.status
    await db.flush()

    persona_result = await db.execute(select(Persona).where(Persona.id == report.persona_id))
    persona = persona_result.scalar_one_or_none()
    reporter_result = await db.execute(select(User).where(User.id == report.reporter_id))
    reporter = reporter_result.scalar_one_or_none()

    return AdminReportItem(
        id=report.id, persona_id=report.persona_id,
        persona_name=persona.name if persona else "삭제된 페르소나",
        reporter_id=report.reporter_id,
        reporter_nickname=reporter.nickname if reporter else "탈퇴한 유저",
        reason=report.reason, description=report.description,
        status=report.status, created_at=report.created_at,
    )
