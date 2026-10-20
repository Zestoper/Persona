"""메일 발송 — Brevo HTTPS API (Render 무료 플랜은 SMTP 포트가 막혀 있어 API로 보낸다).
BREVO_API_KEY가 없으면 개발 환경으로 보고 메일 대신 로그에 남긴다."""
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html: str) -> None:
    if not settings.BREVO_API_KEY:
        logger.warning(f"[메일] BREVO_API_KEY 없음 — 발송 생략: {to_email} | {subject}")
        return
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
            json={
                "sender": {"email": settings.MAIL_FROM, "name": "Persona"},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html,
            },
        )
    if resp.status_code >= 400:
        logger.error(f"[메일] Brevo 발송 실패 {resp.status_code}: {resp.text[:300]}")
    resp.raise_for_status()


def reset_email_html(reset_url: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 16px;">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:24px 28px;">
    <h1 style="color:white;font-size:20px;font-weight:800;margin:0;">Persona</h1>
  </div>
  <div style="background:white;padding:32px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 24px rgba(99,102,241,0.12);">
    <h2 style="font-size:19px;color:#1e1b4b;margin:0 0 12px;">비밀번호 재설정</h2>
    <p style="font-size:15px;color:#555;line-height:1.8;margin:0 0 24px;">
      아래 버튼을 눌러 새 비밀번호를 정해 주세요.<br>링크는 <b>30분 동안 한 번만</b> 쓸 수 있어요.
    </p>
    <a href="{reset_url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);
       color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">비밀번호 재설정하기</a>
    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;">본인이 요청하지 않았다면 이 메일을 무시하세요. 비밀번호는 바뀌지 않습니다.</p>
  </div>
</div>
</body></html>"""
