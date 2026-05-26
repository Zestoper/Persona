# ── 임포트 ────────────────────────────────────────────────
from groq import AsyncGroq                   # Groq 비동기 클라이언트
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import AsyncGenerator            # 비동기 제너레이터 타입 힌트

from app.core.config import settings
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.persona import Persona
from app.models.user import User


# ── 대화방 가져오기 (없으면 새로 생성) ────────────────────
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
    # ── 기존 대화방 찾기 ───────────────────────────────────
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.user_id == user.id,       # 내 대화방
            Conversation.persona_id == persona_id, # 이 페르소나와의 대화방
        )
    )
    conversation = result.scalar_one_or_none()  # 있으면 반환, 없으면 None

    # ── 없으면 새로 생성 ───────────────────────────────────
    if not conversation:
        conversation = Conversation(
            user_id=user.id,
            persona_id=persona_id,
        )
        db.add(conversation)
        await db.flush()           # DB에 INSERT 실행해서 id 받기
        await db.refresh(conversation)

    return conversation


# ── 대화 히스토리 불러오기 ─────────────────────────────────
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
        .order_by(Message.created_at)  # 오래된 것부터 — 대화 흐름 순서 유지
    )
    return list(result.scalars().all())


# ── 메시지 저장 ────────────────────────────────────────────
async def save_message(
    db: AsyncSession,
    conversation_id: int,
    role: str,      # "user" 또는 "assistant"
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


# ── 대화 내용 초기화 ───────────────────────────────────────
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


# ── 핵심: Groq API 스트리밍 호출 ──────────────────────────
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

    lang_rule = "\n- 반드시 한국어(한글)로만 대화하세요. 한자, 중국어, 일본어, 러시아어, 베트남어, 아랍어 등 한글과 영어 이외의 언어는 절대 사용하지 마세요. 영어도 꼭 필요한 경우가 아니면 쓰지 마세요."
    full_system_prompt = system_prompt + lang_rule

    # 대화가 20개 넘으면 오래된 것들을 요약해서 컨텍스트 압축
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

    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True,
        max_tokens=1024,
        temperature=0.8,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
