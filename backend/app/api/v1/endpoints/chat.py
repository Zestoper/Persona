# ── 임포트 ────────────────────────────────────────────────
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


# ── 대화 초기화 ────────────────────────────────────────────
# DELETE /api/v1/chat/{persona_id}/history
@router.delete("/{persona_id}/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    persona_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await chat_service.clear_conversation(db, current_user, persona_id)


# ── WebSocket 채팅 엔드포인트 ──────────────────────────────
# ws://localhost:8000/api/v1/chat/{persona_id}?token=eyJ...
@router.websocket("/{persona_id}")
async def websocket_chat(
    persona_id: int,                         # URL에서 추출: /chat/5 → persona_id=5
    websocket: WebSocket,                    # WebSocket 연결 객체 (전화기 역할)
    token: str,                              # 쿼리 파라미터로 JWT 토큰 받음 (?token=...)
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket 실시간 채팅 엔드포인트.

    WebSocket은 HTTP와 달리 Authorization 헤더를 쓸 수 없어서
    ?token=... 쿼리 파라미터로 JWT 토큰을 받음.
    """
    # ── WebSocket 연결 수락 ────────────────────────────────
    # 전화를 받는 것 — 이걸 해야 통화 시작됨
    await websocket.accept()

    # ── JWT 토큰 검증 ──────────────────────────────────────
    try:
        # get_current_user는 원래 Depends용인데, 직접 호출해서 사용자 가져옴
        current_user: User = await get_current_user(token=token, db=db)
    except Exception:
        # 토큰이 없거나 만료됐으면 에러 메시지 보내고 연결 끊기
        await websocket.send_text(json.dumps({"type": "error", "code": "auth_failed", "message": "세션이 만료됐어요. 다시 로그인해주세요."}))
        await websocket.close()
        return

    # ── 페르소나 존재 + 접근 권한 확인 ───────────────────────
    result = await db.execute(select(Persona).where(Persona.id == persona_id))
    persona = result.scalar_one_or_none()

    if not persona:
        await websocket.send_text(json.dumps({"type": "error", "message": "페르소나를 찾을 수 없습니다"}))
        await websocket.close()
        return

    # 비공개 페르소나는 본인만 접근 가능
    if not persona.is_public and persona.user_id != current_user.id:
        await websocket.send_text(json.dumps({"type": "error", "message": "비공개 페르소나입니다"}))
        await websocket.close()
        return

    # ── 대화방 가져오기 (없으면 생성) ─────────────────────
    conversation = await chat_service.get_or_create_conversation(
        db, current_user, persona_id
    )
    await db.commit()  # 새 대화방이 생성됐을 수 있으니 커밋

    # ── 이전 대화 불러오기 ────────────────────────────────
    history = await chat_service.get_conversation_messages(db, conversation.id)

    # ── 연결 성공 알림 + 이전 대화 전송 ──────────────────
    await websocket.send_text(json.dumps({
        "type": "connected",
        "conversation_id": conversation.id,
        "persona_name": persona.name,
        "persona_avatar": persona.avatar_url,
        "persona_speech_style": persona.speech_style,
        "persona_personality": persona.personality,
        "history": [{"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in history],
    }))

    # ── 대화 루프 시작 ─────────────────────────────────────
    # 비유: 전화 통화 중 — 상대방이 말할 때마다 처리
    try:
        while True:                                   # 연결이 끊길 때까지 무한 반복
            # ── 사용자 메시지 수신 대기 ───────────────────
            user_input = await websocket.receive_text()  # 브라우저에서 문자 올 때까지 대기

            # ── 빈 메시지 / ping 처리 ────────────────────────
            if not user_input.strip():
                continue
            if user_input == "__ping__":
                await websocket.send_text(json.dumps({"type": "pong"}))
                continue

            # ── 사용자 메시지 DB 저장 ─────────────────────
            await chat_service.save_message(db, conversation.id, "user", user_input)

            # ── 대화 히스토리 불러오기 ────────────────────
            history = await chat_service.get_conversation_messages(db, conversation.id)
            # 방금 저장한 user 메시지 제외 (stream_ai_response에서 따로 추가함)
            history = history[:-1]

            # ── AI 답변 스트리밍 시작 알림 ────────────────
            await websocket.send_text(json.dumps({"type": "start"}))

            # ── Groq API 호출 + 글자 단위로 전송 ──────────
            full_response = ""   # 완성된 답변을 모아둘 변수 (DB 저장용)

            async for chunk in chat_service.stream_ai_response(
                system_prompt=persona.system_prompt,  # 페르소나 설정
                history=history,                       # 대화 히스토리
                user_message=user_input,               # 사용자 메시지
            ):
                full_response += chunk   # 글자 조각을 하나씩 이어붙임

                # 글자 조각을 브라우저로 즉시 전송
                await websocket.send_text(json.dumps({
                    "type": "chunk",     # 종류: 글자 조각
                    "content": chunk,    # 내용: 글자 하나 or 단어 조각
                }))

            # ── AI 답변 완료 알림 + DB 저장 ───────────────
            await websocket.send_text(json.dumps({"type": "end"}))

            await chat_service.save_message(db, conversation.id, "assistant", full_response)

            # ── 페르소나 대화 수 증가 ─────────────────────
            persona.chat_count += 1   # 마켓플레이스 인기순 정렬에 사용

            await db.commit()         # user 메시지 + AI 메시지 + chat_count 한번에 저장

    except WebSocketDisconnect:
        # 브라우저가 탭을 닫거나 뒤로가기 누르면 여기로 옴 — 정상 종료
        await db.commit()   # 혹시 저장 안 된 것 있으면 저장
