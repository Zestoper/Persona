import re
import asyncio
import json
import logging

import httpx

logger = logging.getLogger(__name__)
from groq import AsyncGroq
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import AsyncGenerator

from app.core.config import settings
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.persona import Persona
from app.models.user import User

_ALLOWED_RE = re.compile(
    "[^\uAC00-\uD7A3"
    "\u1100-\u11FF"
    "\u3130-\u318F"
    " -~"
    "\u2018-\u201F"
    "\u2026\u2013\u2014"
    "\n\r\t"
    "]+"
)

def _strip_foreign_scripts(text: str) -> str:
    return _ALLOWED_RE.sub("", text)

async def get_or_create_conversation(
    db: AsyncSession,
    user: User,
    persona_id: int,
) -> Conversation:
    """
    유저 + 페르소나 조합의 대화방을 찾고, 없으면 새로 만들어 반환.
    비유: 카카오톡에서 친구 프로필 누르면 기존 채팅방 열리고,
          처음이면 새 채팅방이 열리는 것.
    """

    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.user_id == user.id,
            Conversation.persona_id == persona_id,
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = Conversation(
            user_id=user.id,
            persona_id=persona_id,
        )
        db.add(conversation)
        await db.flush()
        await db.refresh(conversation)

    return conversation

async def get_conversation_messages(
    db: AsyncSession,
    conversation_id: int,
) -> list[Message]:
    """
    대화방의 모든 메시지를 시간순으로 반환.
    Groq API에 대화 맥락으로 전달하기 위해 사용.
    """
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())

async def save_message(
    db: AsyncSession,
    conversation_id: int,
    role: str,
    content: str,
) -> Message:
    """DB에 메시지 한 줄을 저장."""
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message

async def clear_conversation(
    db: AsyncSession,
    user: User,
    persona_id: int,
) -> None:
    result = await db.execute(
        select(Conversation).where(
            Conversation.user_id == user.id,
            Conversation.persona_id == persona_id,
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation:
        await db.execute(delete(Message).where(Message.conversation_id == conversation.id))
        await db.commit()

async def _summarize_old_messages(client: AsyncGroq, messages: list[Message]) -> str:
    """20개 이상 쌓인 오래된 메시지들을 AI로 요약."""
    history_text = "\n".join(
        f"{'사용자' if m.role == 'user' else 'AI'}: {m.content}"
        for m in messages
    )
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "다음 대화 내용을 3-5문장으로 간결하게 한국어로 요약하세요. 핵심 주제와 감정 흐름만 담아주세요."},
            {"role": "user", "content": history_text},
        ],
        max_tokens=300,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""

async def stream_ai_response(
    system_prompt: str,
    history: list[Message],
    user_message: str,
) -> AsyncGenerator[str, None]:
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    lang_rule = (
        "[CRITICAL LANGUAGE RULE - HIGHEST PRIORITY]\n"
        "You MUST respond ONLY in Korean (한글). "
        "NEVER use Chinese characters (漢字/汉字), Japanese (hiragana/katakana/kanji), Arabic, Russian, or any non-Korean script. "
        "Do NOT use Hanja (한자) under any circumstances. "
        "If you need to write names or terms, write them in Korean (한글) only.\n\n"
    )
    full_system_prompt = lang_rule + system_prompt

    if len(history) > 20:
        old_messages = history[:-10]
        recent_messages = history[-10:]
        summary = await _summarize_old_messages(client, old_messages)
        system_with_summary = full_system_prompt + f"\n\n[이전 대화 요약]\n{summary}"
        messages = (
            [{"role": "system", "content": system_with_summary}]
            + [{"role": msg.role, "content": msg.content} for msg in recent_messages]
            + [{"role": "user", "content": user_message}]
        )
    else:
        messages = (
            [{"role": "system", "content": full_system_prompt}]
            + [{"role": msg.role, "content": msg.content} for msg in history]
            + [{"role": "user", "content": user_message}]
        )

    try:
        stream = await asyncio.wait_for(
            client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
                max_tokens=1024,
                temperature=0.8,
            ),
            timeout=20.0,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield _strip_foreign_scripts(delta.content)
        return
    except Exception as e:
        logger.warning(f"[Groq 실패] {type(e).__name__}: {e}")

    # Groq 실패 시 Cerebras로 폴백
    if not settings.CEREBRAS_API_KEY:
        logger.error("[Cerebras] API 키 없음")
        yield "죄송해요, 응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요. 🙏"
        return

    logger.info("[Cerebras] 폴백 시작")
    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            async with http.stream(
                "POST",
                "https://api.cerebras.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.CEREBRAS_API_KEY}"},
                json={
                    "model": "llama3.3-70b",
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 1024,
                    "temperature": 0.8,
                },
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    logger.error(f"[Cerebras] HTTP {resp.status_code}: {body.decode()[:200]}")
                    yield "죄송해요, 현재 AI 서비스가 원활하지 않아요. 잠시 후 다시 시도해주세요. 🙏"
                    return
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        content = json.loads(data)["choices"][0]["delta"].get("content", "")
                        if content:
                            yield _strip_foreign_scripts(content)
                    except Exception:
                        continue
    except Exception as e:
        logger.error(f"[Cerebras] 예외: {type(e).__name__}: {e}")
        yield "죄송해요, 현재 AI 서비스가 원활하지 않아요. 잠시 후 다시 시도해주세요. 🙏"
