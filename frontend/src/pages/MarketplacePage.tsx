import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import PersonaAvatar from '../components/PersonaAvatar'

interface Persona {
  id: number
  name: string
  personality: string
  speech_style: string | null
  chat_count: number
  avatar_url: string | null
}

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sort, setSort] = useState<'popular' | 'latest'>('popular')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setIsLoading(true)
    api.get('/personas/public', { params: { sort, search } })
      .then((res) => setPersonas(res.data))
      .finally(() => setIsLoading(false))
  }, [sort, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleChat = (personaId: number) => {
    if (!user) { navigate('/login'); return }
    navigate(`/chat/${personaId}`)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f8f9fc' }}>

      {/* 히어로 */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', padding: isMobile ? '2rem 1rem 1.5rem' : '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Marketplace</p>
          <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI 캐릭터 마켓플레이스</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.875rem' : '0.9375rem', marginBottom: '1.25rem' }}>다른 사람이 만든 AI 캐릭터와 대화해보세요</p>

          {/* 검색창 */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '480px' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="캐릭터 이름 검색..."
              style={{ flex: 1, padding: '0.625rem 1rem', borderRadius: '10px', border: 'none', fontSize: '0.9375rem', outline: 'none', background: 'rgba(255,255,255,0.95)', color: '#111827' }}
            />
            <button
              type="submit"
              style={{ padding: '0.625rem 1.25rem', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              검색
            </button>
          </form>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>

        {/* 정렬 탭 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['popular', 'latest'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{ padding: '0.375rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: sort === s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f3f4f6', color: sort === s ? 'white' : '#6b7280' }}
              >
                {s === 'popular' ? '인기순' : '최신순'}
              </button>
            ))}
          </div>
          {!isLoading && (
            <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
              {search ? `"${search}" 검색 결과 ` : ''}{personas.length}개
            </span>
          )}
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #f0f0f0', height: '130px' }} />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && personas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>?</span>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {search ? `"${search}"에 해당하는 캐릭터가 없어요` : '아직 공개된 캐릭터가 없어요'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/create')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 2rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
              >
                첫 번째로 만들기
              </button>
            )}
          </div>
        )}

        {/* 카드 목록 */}
        {!isLoading && personas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} onClick={() => handleChat(persona.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PersonaCard({ persona, onClick }: { persona: Persona; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.25rem',
        border: hovered ? '1.5px solid #c7d2fe' : '1.5px solid #f0f0f0',
        boxShadow: hovered ? '0 8px 24px rgba(99,102,241,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <PersonaAvatar name={persona.name} avatarUrl={persona.avatar_url} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 600, color: hovered ? '#6366f1' : '#111827', fontSize: '0.9375rem', margin: '0 0 0.25rem 0', transition: 'color 0.18s' }}>
            {persona.name}
          </h3>
          {persona.speech_style && (
            <span style={{ fontSize: '0.6875rem', color: '#6366f1', background: '#eef2ff', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 500 }}>
              {persona.speech_style}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.55, margin: '0 0 0.875rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {persona.personality}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>
          대화 {persona.chat_count.toLocaleString()}회
        </span>
        <span style={{ fontSize: '0.8125rem', color: hovered ? '#6366f1' : '#9ca3af', fontWeight: 600, transition: 'color 0.18s' }}>
          대화하기 →
        </span>
      </div>
    </div>
  )
}
