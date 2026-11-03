"""평가용 유출 감지 — 실제 채팅과 같은 규칙(app.services.prompt_guard)을 쓴다."""
from app.services.prompt_guard import detect_prompt_leak

__all__ = ["detect_prompt_leak"]
