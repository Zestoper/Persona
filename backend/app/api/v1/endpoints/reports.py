from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.user import User
from app.models.report import Report
from app.models.persona import Persona
from app.core.security import get_current_user
from app.schemas.report import ReportCreate, ReportResponse, REPORT_REASONS

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """페르소나를 신고합니다."""
    if data.reason not in REPORT_REASONS:
        raise HTTPException(status_code=400, detail=f"신고 사유가 올바르지 않습니다. 선택 가능: {REPORT_REASONS}")

    result = await db.execute(select(Persona).where(Persona.id == data.persona_id))
    persona = result.scalar_one_or_none()
    if not persona:
        raise HTTPException(status_code=404, detail="페르소나를 찾을 수 없습니다.")

    if persona.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="본인 페르소나는 신고할 수 없습니다.")

    report = Report(
        reporter_id=current_user.id,
        persona_id=data.persona_id,
        reason=data.reason,
        description=data.description,
        status="pending",
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report
