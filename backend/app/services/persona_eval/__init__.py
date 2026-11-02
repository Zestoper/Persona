"""캐릭터 품질 테스트 — 테스트 질문 생성 → 실제 채팅 파이프라인 응답 → LLM 채점 → 영역별 점수."""
from .runner import CATEGORY_LABELS, evaluate_persona

__all__ = ["evaluate_persona", "CATEGORY_LABELS"]
