import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PersonaAvatar from '../components/PersonaAvatar'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../context/ToastContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import ConfirmModal from '../components/ConfirmModal'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  created_at?: string
}

export default function ChatPage() {
  const { personaId } = useParams<{ personaId: string }>()
  const navigate = useNavigate()
  const c = useThemeColors()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [personaName, setPersonaName] = useState('')
  const [personaAvatar, setPersonaAvatar] = useState<string | null>(null)
  const [personaSpeechStyle, setPersonaSpeechStyle] = useState<string | null>(null)
  const [personaPersonality, setPersonaPersonality] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isDisconnected, setIsDisconnected] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [newMsgCount, setNewMsgCount] = useState(0)

  const isMobile = useIsMobile()
  const { showToast } = useToast()
  const { logout } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const intentionalCloseRef = useRef(false)
  const wasConnectedRef = useRef(false)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const isComposingRef = useRef(false)
  const isAtBottomRef = useRef(true)

  // 스크롤 위치 추적
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distFromBottom < 80
    setShowScrollBtn(distFromBottom > 200)
    if (isAtBottomRef.current) setNewMsgCount(0)
  }, [])

  const scrollToBottom = (force = false) => {
    if (force || isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setNewMsgCount(0)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    // JWT 만료 시각 계산 → 만료되면 자동 로그아웃
    let expiryTimer: ReturnType<typeof setTimeout> | null = null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const msUntilExpiry = payload.exp * 1000 - Date.now()
      if (msUntilExpiry > 0) {
        expiryTimer = setTimeout(() => {
          showToast('세션이 만료됐어요. 다시 로그인해주세요.', 'info')
          intentionalCloseRef.current = true
          wsRef.current?.close()
          logout()
        }, msUntilExpiry)
      }
    } catch {
      // JWT 디코딩 실패 시 무시
    }

    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/api/v1'}/chat/${personaId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'connected') {
        wasConnectedRef.current = true
        setPersonaName(data.persona_name)
        setPersonaAvatar(data.persona_avatar ?? null)
        setPersonaSpeechStyle(data.persona_speech_style ?? null)
        setPersonaPersonality(data.persona_personality ?? null)
        if (data.history?.length > 0) {
          setMessages(data.history)
          setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
        }

      } else if (data.type === 'start') {
        setIsAiTyping(true)
        setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true, created_at: new Date().toISOString() }])
        scrollToBottom()

      } else if (data.type === 'chunk') {
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + data.content }
          }
          return updated
        })
        scrollToBottom()

      } else if (data.type === 'end') {
        setIsAiTyping(false)
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, isStreaming: false }
          }
          return updated
        })
        if (!isAtBottomRef.current) {
          setNewMsgCount((n) => n + 1)
        }
        setTimeout(() => inputRef.current?.focus(), 0)

      } else if (data.type === 'error') {
        if (data.code === 'auth_failed') {
          // 토큰 만료 → 로그아웃 처리 (logout()이 /login으로 리다이렉트)
          showToast(data.message || '세션이 만료됐어요. 다시 로그인해주세요.', 'info')
          intentionalCloseRef.current = true
          logout()
        } else {
          showToast(data.message, 'error')
          navigate('/')
        }
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (!intentionalCloseRef.current) {
        if (!wasConnectedRef.current) {
          // 연결 이벤트 없이 닫힘 = 접근 거부 (비공개 페르소나 등)
          showToast('비공개 처리된 페르소나입니다', 'error')
          navigate(-1)
        } else {
          setIsDisconnected(true)
        }
      }
    }
    return () => {
      if (expiryTimer) clearTimeout(expiryTimer)
      intentionalCloseRef.current = true
      ws.close()
    }
  }, [personaId])

  const clearHistory = async () => {
    await api.delete(`/chat/${personaId}/history`)
    setMessages([])
    showToast('대화 내용이 초기화됐어요.', 'success')
    setShowClearConfirm(false)
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !isConnected || isAiTyping) return
    setMessages((prev) => [...prev, { role: 'user', content: text, created_at: new Date().toISOString() }])
    wsRef.current?.send(text)
    setInput('')
    setTimeout(() => {
      inputRef.current?.focus()
      scrollToBottom(true)
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault()
      sendMessage()
    }
  }

  // textarea 높이 자동 조절
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    showToast('복사됐어요', 'success')
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
    {showClearConfirm && (
      <ConfirmModal
        message="대화 내용을 초기화할까요?"
        subMessage="모든 대화 기록이 삭제되며 되돌릴 수 없어요."
        confirmLabel="초기화"
        danger
        onConfirm={clearHistory}
        onCancel={() => setShowClearConfirm(false)}
      />
    )}
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      {/* 채팅 헤더 */}
      <div style={{ background: c.bgCard, borderBottom: `1px solid ${c.border}`, padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: '1.125rem', padding: '0.25rem', lineHeight: 1 }}
        >
          ←
        </button>
        {/* 이름 클릭 → 상세 페이지 */}
        <button
          onClick={() => navigate(`/persona/${personaId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1, textAlign: 'left' }}
        >
          <PersonaAvatar name={personaName || '?'} avatarUrl={personaAvatar} size={34} radius="10px" />
          <div>
            <p style={{ fontWeight: 600, color: c.textPrimary, fontSize: '0.9375rem', margin: 0, lineHeight: 1.3 }}>{personaName || '연결 중...'}</p>
            <p style={{ fontSize: '0.6875rem', color: isConnected ? '#10b981' : c.textMuted, margin: 0, lineHeight: 1 }}>
              {isConnected ? (personaSpeechStyle || '온라인') : '연결 중...'}
            </p>
          </div>
        </button>
        <button
          onClick={() => setShowClearConfirm(true)}
          style={{ fontSize: '0.75rem', color: c.textMuted, background: 'none', border: `1px solid ${c.borderStrong}`, borderRadius: '8px', padding: '0.3rem 0.75rem', cursor: 'pointer', flexShrink: 0 }}
        >
          초기화
        </button>
      </div>

      {/* 연결 끊김 배너 */}
      {isDisconnected && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '0.625rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
            연결이 끊어졌어요
          </span>
          <button
            onClick={() => { intentionalCloseRef.current = false; setIsDisconnected(false); window.location.reload() }}
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400e', background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '8px', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
          >
            다시 연결
          </button>
        </div>
      )}

      {/* 메시지 목록 */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem 0.875rem' : '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
      >

        {/* 빈 화면 웰컴 카드 */}
        {messages.length === 0 && isConnected && personaName && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '2rem 1rem', gap: '1rem' }}>
            <PersonaAvatar name={personaName} avatarUrl={personaAvatar} size={72} radius="20px" />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, color: c.textPrimary, fontSize: '1.125rem', margin: '0 0 0.375rem 0' }}>{personaName}</p>
              {personaSpeechStyle && (
                <span style={{ background: c.isDark ? '#312e81' : '#eef2ff', color: '#6366f1', fontSize: '0.8125rem', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 500 }}>
                  {personaSpeechStyle}
                </span>
              )}
            </div>
            {personaPersonality && (
              <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '16px', padding: '1rem 1.25rem', maxWidth: '320px', textAlign: 'center' }}>
                <p style={{ color: c.textSecondary, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                  {personaPersonality.length > 100 ? personaPersonality.slice(0, 100) + '...' : personaPersonality}
                </p>
              </div>
            )}
            <p style={{ color: c.textMuted, fontSize: '0.875rem', margin: 0 }}>메시지를 보내보세요</p>
          </div>
        )}

        {/* 메시지들 */}
        {messages.map((msg, i) => {
          const showTime = i === messages.length - 1 || messages[i + 1]?.role !== msg.role
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}>
                {msg.role === 'assistant' && (
                  <PersonaAvatar name={personaName || '?'} avatarUrl={personaAvatar} size={28} radius="8px" />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.125rem', maxWidth: isMobile ? '85%' : '70%' }}>
                  <div
                    onClick={() => !msg.isStreaming && copyMessage(msg.content)}
                    title="클릭하면 복사"
                    style={{
                      padding: '0.625rem 0.9375rem',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.9375rem',
                      lineHeight: 1.6,
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : c.bgCard,
                      color: msg.role === 'user' ? 'white' : c.textPrimary,
                      boxShadow: msg.role === 'user' ? '0 2px 8px rgba(99,102,241,0.25)' : c.shadowCard,
                      border: msg.role === 'assistant' ? `1px solid ${c.border}` : 'none',
                      wordBreak: 'break-word',
                      cursor: msg.isStreaming ? 'default' : 'pointer',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.isStreaming && msg.content === '' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
                        {[0, 1, 2].map((j) => (
                          <span key={j} style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.textMuted, display: 'inline-block', animation: 'typingBounce 1.2s ease infinite', animationDelay: `${j * 0.2}s` }} />
                        ))}
                      </span>
                    ) : (
                      <>
                        {msg.content}
                        {msg.isStreaming && (
                          <span style={{ display: 'inline-block', width: '3px', height: '14px', background: c.textMuted, marginLeft: '3px', verticalAlign: 'middle', borderRadius: '2px', animation: 'pulse 0.8s infinite' }} />
                        )}
                      </>
                    )}
                  </div>

                  {/* 시간 */}
                  {showTime && msg.created_at && !msg.isStreaming && (
                    <span style={{ fontSize: '0.6875rem', color: c.textMuted, padding: '0 0.25rem' }}>
                      {formatTime(msg.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* 새 메시지 / 스크롤 버튼 */}
      {showScrollBtn && (
        <div style={{ position: 'absolute', bottom: isMobile ? '80px' : '90px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button
            onClick={() => scrollToBottom(true)}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '999px', padding: '0.5rem 1.25rem', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            {newMsgCount > 0 ? `↓ 새 메시지 ${newMsgCount}개` : '↓ 아래로'}
          </button>
        </div>
      )}

      {/* 입력창 */}
      <div style={{ background: c.bgCard, borderTop: `1px solid ${c.border}`, padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.25rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isAiTyping ? '답변 중...' : '메시지 입력 (Shift+Enter 줄바꿈)'}
            disabled={!isConnected || isAiTyping}
            rows={1}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: `1.5px solid ${c.borderStrong}`,
              borderRadius: '12px',
              fontSize: '0.9375rem',
              outline: 'none',
              background: (!isConnected || isAiTyping) ? c.bgSoft : c.bgInput,
              color: (!isConnected || isAiTyping) ? c.textMuted : c.textPrimary,
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: '120px',
              overflowY: 'auto',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = c.borderStrong}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || isAiTyping || !input.trim()}
            style={{
              background: (!isConnected || isAiTyping || !input.trim()) ? c.bgSoft : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: (!isConnected || isAiTyping || !input.trim()) ? c.textMuted : 'white',
              border: 'none', borderRadius: '12px', padding: '0.75rem 1.25rem',
              fontSize: '0.9375rem', fontWeight: 600,
              cursor: (!isConnected || isAiTyping || !input.trim()) ? 'not-allowed' : 'pointer',
              flexShrink: 0, transition: 'all 0.15s',
              alignSelf: 'flex-end',
            }}
          >
            전송
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
    </>
  )
}
