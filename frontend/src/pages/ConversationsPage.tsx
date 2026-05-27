import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useThemeColors } from '../hooks/useThemeColors'
import { useIsMobile } from '../hooks/useIsMobile'
import PersonaAvatar from '../components/PersonaAvatar'
import { SkeletonRow } from '../components/Skeleton'

interface ConversationItem {
  id: number
  persona_id: number
  persona_name: string
  persona_avatar_url: string | null
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

export default function ConversationsPage() {
  const navigate = useNavigate()
  const c = useThemeColors()
  const isMobile = useIsMobile()

  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/conversations/me')
      .then((res) => setConversations(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  const formatDate = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '방금'
    if (diffMin < 60) return `${diffMin}분 전`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}시간 전`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay}일 전`
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: isMobile ? '1.75rem 1rem' : '2rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Conversations</p>
          <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.625rem', fontWeight: 700, margin: 0 }}>내 대화 목록</h1>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>

        {/* 로딩 */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} c={c} />)}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', background: c.bgSoft, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>💬</span>
            </div>
            <p style={{ color: c.textSecondary, marginBottom: '1.5rem' }}>아직 대화 기록이 없어요</p>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 2rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
            >
              캐릭터 둘러보기
            </button>
          </div>
        )}

        {/* 대화 목록 */}
        {!isLoading && conversations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                onClick={() => navigate(`/chat/${conv.persona_id}`)}
                formatDate={formatDate}
                c={c}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationRow({
  conv, onClick, formatDate, c,
}: {
  conv: ConversationItem
  onClick: () => void
  formatDate: (iso: string | null) => string
  c: ReturnType<typeof useThemeColors>
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: c.bgCard,
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        border: hovered ? `1.5px solid ${c.borderHover}` : `1.5px solid ${c.border}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? c.shadowHover : c.shadowCard,
      }}
    >
      <PersonaAvatar name={conv.persona_name} avatarUrl={conv.persona_avatar_url} size={48} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 600, color: hovered ? '#6366f1' : c.textPrimary, fontSize: '0.9375rem', transition: 'color 0.15s' }}>
            {conv.persona_name}
          </span>
          <span style={{ fontSize: '0.75rem', color: c.textMuted, flexShrink: 0 }}>
            {formatDate(conv.last_message_at || conv.created_at)}
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: c.textSecondary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {conv.last_message || '대화를 시작해보세요'}
        </p>
      </div>

      <span style={{ color: hovered ? '#6366f1' : c.textMuted, fontSize: '1rem', flexShrink: 0, transition: 'color 0.15s' }}>›</span>
    </div>
  )
}
