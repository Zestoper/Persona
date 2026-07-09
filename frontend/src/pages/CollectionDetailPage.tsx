import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'
import PersonaCard, { type PersonaCardData } from '../components/PersonaCard'
import { SkeletonCard } from '../components/Skeleton'

interface CollectionDetail {
  id: number
  title: string
  description: string | null
  emoji: string | null
  is_featured: boolean
  created_at: string
  personas: PersonaCardData[]
}

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const c = useThemeColors()
  const { showToast } = useToast()

  const [collection, setCollection] = useState<CollectionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get(`/collections/${collectionId}`)
      .then((res) => setCollection(res.data))
      .catch(() => {
        showToast('컬렉션을 찾을 수 없어요', 'error')
        navigate('/collections')
      })
      .finally(() => setIsLoading(false))
  }, [collectionId])

  useEffect(() => {
    if (!user) return
    api.get('/favorites/ids')
      .then((res) => setFavoritedIds(new Set(res.data.ids)))
      .catch(() => {})
  }, [user])

  const handleToggleFavorite = async (personaId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { showToast('로그인 후 이용해주세요', 'info'); return }
    try {
      await api.post(`/favorites/${personaId}`)
      setFavoritedIds((prev) => {
        const next = new Set(prev)
        next.has(personaId) ? next.delete(personaId) : next.add(personaId)
        return next
      })
    } catch {
      showToast('오류가 발생했어요', 'error')
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage }}>
        <div style={{ height: '160px', background: c.bgHero }} />
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} c={c} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!collection) return null

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      <div style={{ background: c.bgHero, padding: isMobile ? '2rem 1rem 1.5rem' : '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <button
            onClick={() => navigate('/collections')}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '0.8125rem', fontWeight: 500, padding: '0.375rem 0.875rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem', backdropFilter: 'blur(4px)' }}
          >
            ← 컬렉션 목록
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
              {collection.emoji || '📚'}
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.875rem', fontWeight: 700, margin: '0 0 0.375rem 0' }}>
                {collection.title}
              </h1>
              {collection.description && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.875rem' : '0.9375rem', margin: 0 }}>
                  {collection.description}
                </p>
              )}
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', marginTop: '1rem', marginBottom: 0 }}>
            페르소나 {collection.personas.length}개
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>
        {collection.personas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <p style={{ color: c.textSecondary, fontSize: '1rem' }}>아직 이 컬렉션에 페르소나가 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {collection.personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isFavorited={favoritedIds.has(persona.id)}
                onClick={() => navigate(`/persona/${persona.id}`)}
                onToggleFavorite={(e) => handleToggleFavorite(persona.id, e)}
                c={c}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
