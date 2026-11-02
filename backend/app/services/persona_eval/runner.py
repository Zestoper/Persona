"""
캐릭터 품질 테스트 실행.

핵심: 테스트용으로 따로 만든 호출이 아니라 **실제 채팅과 같은 함수(chat_service.stream_ai_response)** 로
응답을 받는다. 그래서 요약·폴백·외국 문자 필터까지 포함한 실제 서비스 품질이 측정된다.

점수
- 질문 1개당 1~5점
- 영역 점수 = 영역 평균을 0~100으로 환산 ((평균-1)/4*100)
- 종합 점수 = 영역 점수의 평균 (영역마다 질문 수가 달라도 같은 비중)
"""
import asyncio
import time
from types import SimpleNamespace

from groq import AsyncGroq

from app.core.config import settings
from app.services.chat_service import stream_ai_response

from .judge import judge
from .leak import detect_prompt_leak
from .probes import Probe, build_probes

CATEGORY_LABELS = {
    "facts": "설정 사실",
    "style": "말투 유지",
    "character": "캐릭터 이탈 저항",
    "long": "긴 대화 후 설정 유지",
    "language": "언어 규칙",
}

# Groq 무료 한도(분당 요청 수)를 넘지 않도록 호출 사이에 쉰다
_PAUSE_SEC = 1.5


async def _answer(persona, probe: Probe) -> str:
    history = [SimpleNamespace(role=m["role"], content=m["content"]) for m in probe.history]
    chunks = []
    async for chunk in stream_ai_response(persona.system_prompt, history, probe.question):
        chunks.append(chunk)
    return "".join(chunks).strip()


def _to_100(scores: list[int]) -> float | None:
    valid = [s for s in scores if s is not None]
    if not valid:
        return None
    return round((sum(valid) / len(valid) - 1) / 4 * 100, 1)


async def evaluate_persona(persona) -> dict:
    """persona: name / personality / background / speech_style / system_prompt 속성을 가진 객체"""
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    started = time.monotonic()

    probes = await build_probes(client, persona)
    results = []
    for probe in probes:
        await asyncio.sleep(_PAUSE_SEC)
        try:
            answer = await _answer(persona, probe)
        except Exception as e:  # noqa: BLE001 — 한 질문 실패가 전체 평가를 멈추지 않게
            answer = f"(응답 생성 실패: {type(e).__name__})"
        leaked = detect_prompt_leak(answer, persona.system_prompt)
        if leaked:
            # 시스템 프롬프트 유출은 LLM 채점에 맡기지 않고 코드로 확정 판정 (LLM 채점은 4개 중 2개를 놓쳤다)
            verdict = {"score": 1, "reason": f"시스템 프롬프트 유출 (일치 문구 {len(leaked)}개: {leaked[0][:30]}…)"}
        else:
            await asyncio.sleep(_PAUSE_SEC)
            verdict = await judge(client, persona, probe.category, probe.question, probe.expected, answer)
        results.append({
            "category": probe.category,
            "question": probe.question,
            "expected": probe.expected,
            "answer": answer,
            "history_turns": len(probe.history),
            "leaked": bool(leaked),
            **verdict,
        })

    categories = {}
    for key, label in CATEGORY_LABELS.items():
        scores = [r["score"] for r in results if r["category"] == key]
        if scores:
            categories[key] = {"label": label, "score": _to_100(scores), "count": len(scores)}

    cat_scores = [c["score"] for c in categories.values() if c["score"] is not None]
    leak_probes = [r for r in results if r["category"] == "character"]
    return {
        "leak_count": sum(r["leaked"] for r in results),
        "leak_probe_count": len(leak_probes),
        "persona_id": getattr(persona, "id", None),
        "persona_name": persona.name,
        "overall": round(sum(cat_scores) / len(cat_scores), 1) if cat_scores else None,
        "categories": categories,
        "results": results,
        "seconds": round(time.monotonic() - started, 1),
    }
