import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PersonaAvatar from '../components/PersonaAvatar'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../context/ToastContext'
import api from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export default function ChatPage() {
  const { personaId } = useParams<{ personaId: string }>()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [personaName, setPersonaName] = useState('')
  const [personaAvatar, setPersonaAvatar] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)

  const isMobile = useIsMobile()
  const { showToast } = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isComposingRef = useRef(false) // 한글 조합 중 여부 추적

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    const ws = new WebSocket(`ws://localhost:8000/api/v1/chat/${personaId}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'connected') {
        setPersonaName(data.persona_name)
        setPersonaAvatar(data.persona_avatar ?? null)
        if (data.history?.length > 0) {
          setMessages(data.history)
        }
      } else if (data.type === 'start') {
        setIsAiTyping(true)
        setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }])
      } else if (data.type === 'chunk') {
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + data.content }
          }
          return updated
        })
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
        setTimeout(() => inputRef.current?.focus(), 0)
      } else if (data.type === 'error') {
        showToast(data.message, 'error')
        navigate('/')
      }
    }

    ws.onclose = () => setIsConnected(false)
    return () => ws.close()
  }, [personaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const clearHistory = async () => {
    if (!confirm('대화 내용을 모두 삭제할까요?')) return
    await api.delete(`/chat/${personaId}/history`)
    setMessages([])
    showToast('대화 내용이 초기화됐어요.', 'success')
  }

  const sendMessage = () => {
    if (!input.trim() || !isConnected || isAiTyping) return
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    wsRef.current?.send(input)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: '#f8f9fc' }}>

      {/* 채팅 헤더 */}
      <div style={{ background: 'white', borderBottom: '1px solid #f0f0f0', padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.125rem', padding: '0.25rem', lineHeight: 1 }}
        >
          ←
        </button>
        <PersonaAvatar name={personaName || '?'} avatarUrl={personaAvatar} size={34} radius="10px" />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem', margin: 0, lineHeight: 1.3 }}>{personaName || '연결 중...'}</p>
          <p style={{ fontSize: '0.6875rem', color: isConnected ? '#10b981' : '#d1d5db', margin: 0, lineHeight: 1 }}>
            {isConnected ? '온라인' : '연결 중...'}
          </p>
        </div>
        <button
          onClick={clearHistory}
          style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.3rem 0.75rem', cursor: 'pointer' }}
        >
          대화 초기화
        </button>
      </div>

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '1rem 0.875rem' : '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {messages.length === 0 && isConnected && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#d1d5db', fontSize: '0.9375rem' }}>
            {personaName}에게 메시지를 보내보세요
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}
          >
            {msg.role === 'assistant' && (
              <PersonaAvatar name={personaName || '?'} avatarUrl={personaAvatar} size={28} radius="8px" />
            )}

            <div
              style={{
                maxWidth: isMobile ? '85%' : '70%',
                padding: '0.625rem 0.9375rem',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'white',
                color: msg.role === 'user' ? 'white' : '#1f2937',
                boxShadow: msg.role === 'user' ? '0 2px 8px rgba(99,102,241,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                border: msg.role === 'assistant' ? '1px solid #f0f0f0' : 'none',
                wordBreak: 'break-word',
              }}
            >
              {msg.isStreaming && msg.content === '' ? (
                // 아직 첫 글자 안 왔을 때 — 세 점 튀기는 인디케이터
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#9ca3af', display: 'inline-block', animation: `typingBounce 1.2s ease infinite`, animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
              ) : (
                <>
                  {msg.content}
                  {msg.isStreaming && (
                    <span style={{ display: 'inline-block', width: '3px', height: '14px', background: '#9ca3af', marginLeft: '3px', verticalAlign: 'middle', borderRadius: '2px', animation: 'pulse 0.8s infinite' }} />
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div style={{ background: 'white', borderTop: '1px solid #f0f0f0', padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            placeholder={isAiTyping ? '답변 중...' : '메시지를 입력하세요'}
            disabled={!isConnected || isAiTyping}
            onCompositionStart={() => { isComposingRef.current = true }}
            onCompositionEnd={() => { isComposingRef.current = false }}
            style={{ flex: 1, padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '0.9375rem', outline: 'none', background: (!isConnected || isAiTyping) ? '#f9fafb' : 'white', color: (!isConnected || isAiTyping) ? '#9ca3af' : '#111827' }}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || isAiTyping || !input.trim()}
            style={{
              background: (!isConnected || isAiTyping || !input.trim()) ? '#f3f4f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: (!isConnected || isAiTyping || !input.trim()) ? '#d1d5db' : 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1.25rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: (!isConnected || isAiTyping || !input.trim()) ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
