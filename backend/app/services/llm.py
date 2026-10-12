"""Groq 모델 폴백 체인 + Cerebras 폴백.

Groq 무료 한도는 계정 안에서 모델별로 따로 센다.
한 모델이 막히면(한도 초과 429 · 모델 폐기 404 · 요청 과대 413 · 서버 오류 5xx)
다음 모델로 넘어가고, Groq 모델이 전부 막히면 Cerebras로 넘어간다.
(스트리밍은 Cerebras 스트리밍 폴백을 chat_service가 직접 처리한다.)
"""
import logging
from types import SimpleNamespace

import httpx
from groq import APIConnectionError, APIStatusError, APITimeoutError, AsyncGroq, RateLimitError

from app.core.config import settings

logger = logging.getLogger(__name__)

GROQ_MODELS = ("openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b")
_NEXT_MODEL_STATUS = (404, 413, 500, 502, 503, 504)


async def groq_create(client: AsyncGroq, *, messages: list, max_tokens: int,
                      temperature: float, stream: bool = False):
    last_err: Exception | None = None
    for model in GROQ_MODELS:
        # gpt-oss는 추론형 — 생각은 짧게 / qwen은 생각 모드 끔
        effort = "low" if model.startswith("openai/gpt-oss") else "none"
        try:
            return await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=stream,
                extra_body={"reasoning_effort": effort},
            )
        except (RateLimitError, APIConnectionError, APITimeoutError) as e:
            last_err = e
        except APIStatusError as e:
            if e.status_code not in _NEXT_MODEL_STATUS:
                raise
            last_err = e
        logger.warning(f"[Groq] {model} 실패 — 다음 모델 시도: {type(last_err).__name__}")

    if stream or not settings.CEREBRAS_API_KEY:
        raise last_err  # 스트리밍은 호출한 쪽이 Cerebras 스트리밍으로 폴백

    logger.info("[Cerebras] Groq 모델 전부 실패 — Cerebras로 폴백")
    async with httpx.AsyncClient(timeout=30.0) as http:
        resp = await http.post(
            "https://api.cerebras.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.CEREBRAS_API_KEY}"},
            json={"model": "gpt-oss-120b", "messages": messages, "max_tokens": max_tokens,
                  "temperature": temperature, "reasoning_effort": "low"},
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"].get("content") or ""
    # Groq 응답과 같은 모양(res.choices[0].message.content)으로 돌려준다
    return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])
