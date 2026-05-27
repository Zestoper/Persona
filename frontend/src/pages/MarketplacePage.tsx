import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'
import PersonaCard, { type PersonaCardData as Persona } from '../components/PersonaCard'
import { SkeletonCard } from '../components/Skeleton'

const POPULAR_TAGS = ['친구', '연인', '멘토', '캐릭터', '판타지', '학교', '직장', '힐링']

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const c = useThemeColors()
  const { showToast } = useToast()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const LIMIT = 20
  const [sort, setSort] = useState<'popular' | 'latest'>('popular')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())
  const [favoritePersonas, setFavoritePersonas] = useState<Persona[]>([])

  // 공개 페르소나 목록 로드 (필터 변경 시 초기화)
  useEffect(() => {
    setIsLoading(true)
    setSkip(0)
    setHasMore(true)
    api.get('/personas/public', { params: { sort, search, tag: tagFilter, skip: 0, limit: LIMIT } })
      .then((res) => {
        setPersonas(res.data)
        setHasMore(res.data.length === LIMIT)
      })
      .finally(() => setIsLoading(false))
  }, [sort, search, tagFilter])

  const handleLoadMore = async () => {
    const nextSkip = skip + LIMIT
    setIsLoadingMore(true)
    try {
      const res = await api.get('/personas/public', { params: { sort, search, tag: tagFilter, skip: nextSkip, limit: LIMIT } })
      setPersonas((prev) => [...prev, ...res.data])
      setSkip(nextSkip)
      setHasMore(res.data.length === LIMIT)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 즐겨찾기 목록 로드 (로그인 시)
  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); return }
    api.get('/favorites/ids')
      .then((res) => setFavoritedIds(new Set(res.data.ids)))
      .catch(() => {})
    api.get('/favorites')
      .then((res) => setFavoritePersonas(res.data))
      .catch(() => {})
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setTagFilter('')
    setShowFavoritesOnly(false)
  }

  const handleTagFilter = (tag: string) => {
    setTagFilter(tag === tagFilter ? '' : tag)
    setSearch('')
    setSearchInput('')
    setShowFavoritesOnly(false)
  }

  const handleChat = (personaId: number) => {
    navigate(`/persona/${personaId}`)
  }

  const handleToggleFavorite = async (personaId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { showToast('로그인이 필요해요', 'info'); navigate('/login'); return }
    try {
      const res = await api.post(`/favorites/${personaId}`)
      if (res.data.is_favorited) {
        setFavoritedIds((prev) => new Set([...prev, personaId]))
        const persona = personas.find((p) => p.id === personaId)
        if (persona) setFavoritePersonas((prev) => [...prev, persona])
        showToast('즐겨찾기에 추가됐어요', 'success')
      } else {
        setFavoritedIds((prev) => { const s = new Set(prev); s.delete(personaId); return s })
        setFavoritePersonas((prev) => prev.filter((p) => p.id !== personaId))
        showToast('즐겨찾기에서 제거됐어요', 'info')
      }
    } catch {
      showToast('오류가 발생했어요', 'error')
    }
  }

  const displayedPersonas = showFavoritesOnly ? favoritePersonas : personas

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      {/* 히어로 */}
      <div style={{ background: c.bgHero, padding: isMobile ? '2rem 1rem 1.5rem' : '2.5rem 1.5rem 2rem' }}>
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

        {/* 태그 필터 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: tagFilter === tag ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : c.bgSoft,
                color: tagFilter === tag ? 'white' : c.textSecondary,
              }}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* 정렬 탭 + 즐겨찾기 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['popular', 'latest'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSort(s); setShowFavoritesOnly(false) }}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: sort === s && !showFavoritesOnly ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : c.bgSoft,
                  color: sort === s && !showFavoritesOnly ? 'white' : c.textSecondary,
                }}
              >
                {s === 'popular' ? '인기순' : '최신순'}
              </button>
            ))}
            {user && (
              <button
                onClick={() => setShowFavoritesOnly((p) => !p)}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: showFavoritesOnly ? '#fef3c7' : c.bgSoft,
                  color: showFavoritesOnly ? '#d97706' : c.textSecondary,
                }}
              >
                ♥ 즐겨찾기
              </button>
            )}
          </div>
          {!isLoading && (
            <span style={{ fontSize: '0.8125rem', color: c.textMuted }}>
              {tagFilter ? `#${tagFilter} ` : search ? `"${search}" ` : showFavoritesOnly ? '즐겨찾기 ' : ''}
              {displayedPersonas.length}개
            </span>
          )}
        </div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} c={c} />)}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && displayedPersonas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', background: c.bgSoft, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', color: c.textMuted }}>{showFavoritesOnly ? '♥' : '?'}</span>
            </div>
            <p style={{ color: c.textSecondary, marginBottom: '1.5rem' }}>
              {showFavoritesOnly ? '즐겨찾기한 캐릭터가 없어요' : tagFilter ? `#${tagFilter} 태그의 캐릭터가 없어요` : search ? `"${search}"에 해당하는 캐릭터가 없어요` : '아직 공개된 캐릭터가 없어요'}
            </p>
            {!search && !tagFilter && !showFavoritesOnly && (
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
        {!isLoading && displayedPersonas.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {displayedPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isFavorited={favoritedIds.has(persona.id)}
                  onClick={() => handleChat(persona.id)}
                  onToggleFavorite={(e) => handleToggleFavorite(persona.id, e)}
                  c={c}
                />
              ))}
            </div>

            {/* 더 보기 버튼 (즐겨찾기 모드 아닐 때만) */}
            {!showFavoritesOnly && hasMore && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  style={{ padding: '0.75rem 2.5rem', borderRadius: '12px', border: `1.5px solid ${c.borderStrong}`, background: c.bgCard, color: c.textSecondary, cursor: isLoadingMore ? 'default' : 'pointer', fontSize: '0.9375rem', fontWeight: 600 }}
                >
                  {isLoadingMore ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
