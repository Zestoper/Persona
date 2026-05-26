from pydantic import BaseModel

REPORT_REASONS = ["욕설/혐오발언", "성인물", "스팸/광고", "사기/사칭", "기타"]


class ReportCreate(BaseModel):
    persona_id: int
    reason: str
    description: str | None = None


class ReportResponse(BaseModel):
    id: int
    persona_id: int
    reason: str
    status: str

    class Config:
        from_attributes = True
