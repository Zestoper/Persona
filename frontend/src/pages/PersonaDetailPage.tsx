import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../context/ToastContext'
import PersonaAvatar from '../components/PersonaAvatar'
import { SkeletonCard } from '../components/Skeleton'

interface Persona {
  id: number
  user_id: number
  name: string
  personality: string
  background: string | null
  speech_style: string | null
  is_public: boolean
  chat_count: number
  avatar_url: string | null
  tags: string | null
  created_at: string
  creator_nickname: string | null
}

const REPORT_REASONS = ['욕설/혐오발언', '성인물', '스팸/광고', '사기/사칭', '기타']

export default function PersonaDetailPage() {
  const { personaId } = useParams<{ personaId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const c = useThemeColors()
  const isMobile = useIsMobile()
  const { showToast } = useToast()

  const [persona, setPersona] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [forkLoading, setForkLoading] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    if (!personaId) return
    setIsLoading(true)
    api.get(`/personas/${personaId}`)
      .then((res) => setPersona(res.data))
      .catch(() => navigate('/'))
      .finally(() => setIsLoading(false))
  }, [personaId, navigate])

  useEffect(() => {
    if (!user || !personaId) return
    api.get('/favorites/ids')
      .then((res) => setIsFavorited((res.data.ids as number[]).includes(Number(personaId))))
      .catch(() => {})
  }, [user, personaId])

  const handleChat = () => {
    if (!user) { navigate('/login'); return }
    navigate(`/chat/${personaId}`)
  }

  const handleToggleFavorite = async () => {
    if (!user) { showToast('로그인이 필요해요', 'info'); navigate('/login'); return }
    setFavLoading(true)
    try {
      const res = await api.post(`/favorites/${personaId}`)
      setIsFavorited(res.data.is_favorited)
      showToast(res.data.is_favorited ? '즐겨찾기에 추가됐어요' : '즐겨찾기에서 제거됐어요', res.data.is_favorited ? 'success' : 'info')
    } catch {
      showToast('오류가 발생했어요', 'error')
    } finally {
      setFavLoading(false)
    }
  }

  const handleFork = async () => {
    if (!user) { navigate('/login'); return }
    setForkLoading(true)
    try {
      await api.post(`/personas/${personaId}/fork`)
      showToast('내 페르소나로 복사됐어요!', 'success')
      navigate('/my')
    } catch {
      showToast('복사에 실패했어요', 'error')
    } finally {
      setForkLoading(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason) { showToast('신고 사유를 선택해주세요', 'info'); return }
    setReportLoading(true)
    try {
      await api.post('/reports', { persona_id: Number(personaId), reason: reportReason, description: reportDesc || null })
      showToast('신고가 접수됐어요. 검토 후 처리됩니다.', 'success')
      setShowReportModal(false)
      setReportReason('')
      setReportDesc('')
    } catch (err: any) {
      showToast(err?.response?.data?.detail || '신고에 실패했어요', 'error')
    } finally {
      setReportLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard c={c} />
          <SkeletonCard c={c} />
        </div>
      </div>
    )
  }

  if (!persona) return null

  const tags = persona.tags ? persona.tags.split(',').filter(Boolean) : []
  const isOwner = user?.id === persona.user_id
  const canFork = user && persona.is_public && !isOwner
  const canReport = user && !isOwner

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: isMobile ? '2rem 1rem' : '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '0.375rem 0.875rem', fontSize: '0.8125rem', cursor: 'pointer', marginBottom: '1.25rem' }}
          >
            ← 뒤로
          </button>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <PersonaAvatar name={persona.name} avatarUrl={persona.avatar_url} size={isMobile ? 72 : 90} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.75rem', fontWeight: 700, margin: 0 }}>{persona.name}</h1>
                {!persona.is_public && (
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>비공개</span>
                )}
              </div>
              {persona.speech_style && (
                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.8125rem', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 500, display: 'inline-block', marginBottom: '0.5rem' }}>
                  {persona.speech_style}
                </span>
              )}
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', margin: 0 }}>
                대화 {persona.chat_count.toLocaleString()}회
                {persona.creator_nickname && (
                  <span style={{ marginLeft: '0.75rem' }}>· by {persona.creator_nickname}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.5rem' }}>
            {tags.map((tag) => (
              <span key={tag} style={{ background: c.isDark ? '#312e81' : '#eef2ff', color: '#6366f1', fontSize: '0.8125rem', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 500 }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleChat}
            style={{ flex: '1 1 auto', minWidth: isMobile ? '100%' : '160px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}
          >
            대화 시작하기
          </button>

          {user && (
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', border: `1.5px solid ${isFavorited ? '#ef4444' : c.borderStrong}`, background: isFavorited ? (c.isDark ? '#2d1a1a' : '#fff5f5') : c.bgCard, color: isFavorited ? '#ef4444' : c.textSecondary, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {isFavorited ? '♥ 즐겨찾기' : '♡ 즐겨찾기'}
            </button>
          )}

          {canFork && (
            <button
              onClick={handleFork}
              disabled={forkLoading}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', border: `1.5px solid ${c.borderStrong}`, background: c.bgCard, color: c.textSecondary, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {forkLoading ? '복사 중...' : '⎘ 복사'}
            </button>
          )}

          {canReport && (
            <button
              onClick={() => setShowReportModal(true)}
              style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: `1.5px solid ${c.borderStrong}`, background: c.bgCard, color: c.textMuted, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}
            >
              신고
            </button>
          )}
        </div>

        <Section title="성격" c={c}>
          <p style={{ color: c.textSecondary, lineHeight: 1.7, margin: 0 }}>{persona.personality}</p>
        </Section>

        {persona.background && (
          <Section title="배경스토리" c={c}>
            <p style={{ color: c.textSecondary, lineHeight: 1.7, margin: 0 }}>{persona.background}</p>
          </Section>
        )}

        {isOwner && (
          <button
            onClick={() => navigate(`/edit/${persona.id}`)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: `1.5px solid ${c.borderStrong}`, background: 'none', color: c.textSecondary, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500, marginTop: '0.5rem' }}
          >
            수정하기
          </button>
        )}
      </div>

      {showReportModal && (
        <div
          onClick={() => setShowReportModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: c.bgCard, borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
          >
            <h2 style={{ color: c.textPrimary, fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>페르소나 신고</h2>

            <p style={{ color: c.textSecondary, fontSize: '0.875rem', marginBottom: '1rem' }}>신고 사유를 선택해주세요</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  style={{
                    padding: '0.625rem 1rem', borderRadius: '10px', textAlign: 'left', cursor: 'pointer',
                    border: `1.5px solid ${reportReason === r ? '#6366f1' : c.borderStrong}`,
                    background: reportReason === r ? (c.isDark ? '#312e81' : '#eef2ff') : c.bgSoft,
                    color: reportReason === r ? '#6366f1' : c.textLabel,
                    fontWeight: reportReason === r ? 600 : 400,
                    fontSize: '0.9375rem',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              placeholder="추가 설명 (선택)"
              rows={3}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.9375rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '1.25rem' }}
            />

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: 'none', color: c.textSecondary, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 500 }}
              >
                취소
              </button>
              <button
                onClick={handleReport}
                disabled={reportLoading || !reportReason}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: reportReason ? '#ef4444' : c.bgSoft, color: reportReason ? 'white' : c.textMuted, cursor: reportReason ? 'pointer' : 'default', fontSize: '0.9375rem', fontWeight: 600 }}
              >
                {reportLoading ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: ReturnType<typeof useThemeColors> }) {
  return (
    <div style={{ background: c.bgCard, borderRadius: '16px', padding: '1.25rem 1.5rem', border: `1px solid ${c.border}`, marginBottom: '1rem' }}>
      <h3 style={{ color: c.textLabel, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem 0' }}>{title}</h3>
      {children}
    </div>
  )
}
