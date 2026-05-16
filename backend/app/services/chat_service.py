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
async def stream_ai_response(
    system_prompt: str,          # 페르소나의 성격/말투가 담긴 지침
    history: list[Message],      # 지금까지의 대화 내용
    user_message: str,           # 사용자가 방금 보낸 메시지
) -> AsyncGenerator[str, None]:
    """
    Groq API를 호출해서 AI 답변을 한 글자씩 흘려보내는 함수.
    비유: 라디오 생방송. 말이 끝날 때까지 기다리지 않고 나오는 대로 바로 전달.

    AsyncGenerator : 값을 한 번에 다 반환하지 않고, yield로 조금씩 반환하는 함수.
    """
    # ── Groq 클라이언트 생성 ───────────────────────────────
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    # ── 메시지 목록 조립 ───────────────────────────────────
    # Groq API는 [system, user, assistant, user, ...] 순서의 리스트를 받음
    full_system_prompt = system_prompt + "\n- 반드시 한국어(한글)로만 대화하세요. 한자, 중국어, 일본어, 러시아어, 베트남어, 아랍어 등 한글과 영어 이외의 언어는 절대 사용하지 마세요. 영어도 꼭 필요한 경우가 아니면 쓰지 마세요."

    messages = (
        # 1) system: 페르소나 설정 (항상 맨 앞)
        [{"role": "system", "content": full_system_prompt}]
        # 2) 지금까지의 대화 히스토리
        + [{"role": msg.role, "content": msg.content} for msg in history]
        # 3) 사용자가 방금 보낸 메시지 (맨 뒤)
        + [{"role": "user", "content": user_message}]
    )

    # ── Groq API 스트리밍 호출 ─────────────────────────────
    # stream=True : 답변을 한 번에 받지 않고, 조각조각 흘려받음
    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",  # 가장 똑똑한 Llama 모델
        messages=messages,
        stream=True,                       # 스트리밍 모드 ON
        max_tokens=1024,                   # 답변 최대 길이 (토큰 = 단어 조각 단위)
        temperature=0.8,  # 창의성 조절 (0: 딱딱하고 예측가능, 1: 창의적, 2: 랜덤)
    )

    # ── 스트림에서 글자 꺼내기 ─────────────────────────────
    # 비유: 수도꼭지에서 물이 조금씩 나오는 것처럼, 글자가 조금씩 나옴
    async for chunk in stream:            # chunk = 글자 조각 하나
        delta = chunk.choices[0].delta    # choices[0]: 첫 번째 답변 선택지
        if delta.content:                 # 글자가 있는 조각만 처리 (빈 조각 무시)
            yield delta.content           # 글자를 호출한 쪽으로 바로 넘겨줌
