import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.persona import Persona
from app.models.user import User
from app.core.security import get_current_user
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.delete("/{persona_id}/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await chat_service.clear_conversation(db, current_user, persona_id)

@router.websocket("/{persona_id}")
async def websocket_chat(
    persona_id: int,
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket 실시간 채팅 엔드포인트.

    WebSocket은 HTTP와 달리 Authorization 헤더를 쓸 수 없어서
    ?token=... 쿼리 파라미터로 JWT 토큰을 받음.
    """

    await websocket.accept()

    try:

        current_user: User = await get_current_user(token=token, db=db)
    except Exception:

        await websocket.send_text(json.dumps({"type": "error", "code": "auth_failed", "message": "세션이 만료됐어요. 다시 로그인해주세요."}))
        await websocket.close()
        return

    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()

    if not persona:
        await websocket.send_text(json.dumps({"type": "error", "message": "페르소나를 찾을 수 없습니다"}))
        await websocket.close()
        return

    if not persona.is_public and persona.user_id != current_user.id:
        await websocket.send_text(json.dumps({"type": "error", "message": "비공개 페르소나입니다"}))
        await websocket.close()
        return

    conversation = await chat_service.get_or_create_conversation(
        db, current_user, persona_id
    )
    await db.commit()

    history = await chat_service.get_conversation_messages(db, conversation.id)

    await websocket.send_text(json.dumps({
        "type": "connected",
        "conversation_id": conversation.id,
        "persona_name": persona.name,
        "persona_avatar": persona.avatar_url,
        "persona_speech_style": persona.speech_style,
        "persona_personality": persona.personality,
        "history": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in history],
    }))

    try:
        while True:

            user_input = await websocket.receive_text()

            if not user_input.strip():
                continue
            if user_input == "__ping__":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            await chat_service.save_message(db, conversation.id, "user", user_input)

            history = await chat_service.get_conversation_messages(db, conversation.id)

            history = history[:-1]

            await websocket.send_text(json.dumps({"type": "start"}))

            full_response = ""

            async for chunk in chat_service.stream_ai_response(
                system_prompt=persona.system_prompt,
                history=history,
                user_message=user_input,
            ):
                full_response += chunk

                await websocket.send_text(json.dumps({
                    "type": "chunk",
                    "content": chunk,
                }))

            await websocket.send_text(json.dumps({"type": "end"}))

            await chat_service.save_message(db, conversation.id, "assistant", full_response)

            persona.chat_count += 1

            await db.commit()

    except WebSocketDisconnect:

        await db.commit()
