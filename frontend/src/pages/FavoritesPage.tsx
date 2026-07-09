import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useThemeColors } from '../hooks/useThemeColors'
import PersonaCard, { type PersonaCardData } from '../components/PersonaCard'
import { SkeletonCard } from '../components/Skeleton'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const c = useThemeColors()
  const { showToast } = useToast()

  const [personas, setPersonas] = useState<PersonaCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/favorites')
      .then((res) => setPersonas(res.data))
      .catch(() => showToast('즐겨찾기를 불러오는 데 실패했어요', 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  const handleRemoveFavorite = async (personaId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.post(`/favorites/${personaId}`)
      setPersonas((prev) => prev.filter((p) => p.id !== personaId))
      showToast('즐겨찾기에서 제거됐어요', 'info')
    } catch {
      showToast('오류가 발생했어요', 'error')
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      <div style={{ background: c.bgHero, padding: isMobile ? '2rem 1rem 1.5rem' : '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Favorites</p>
          <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            즐겨찾기
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.875rem' : '0.9375rem' }}>
            즐겨찾기한 AI 캐릭터들을 모아볼 수 있어요
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>

        {!isLoading && (
          <p style={{ fontSize: '0.8125rem', color: c.textMuted, marginBottom: '1rem' }}>
            {personas.length}개
          </p>
        )}

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} c={c} />)}
          </div>
        )}

        {!isLoading && personas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: '64px', height: '64px', background: c.bgSoft, borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem' }}>♡</span>
            </div>
            <p style={{ color: c.textSecondary, marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              아직 즐겨찾기한 캐릭터가 없어요
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 2rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
            >
              마켓플레이스 둘러보기
            </button>
          </div>
        )}

        {!isLoading && personas.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {personas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                isFavorited={true}
                onClick={() => navigate(`/persona/${persona.id}`)}
                onToggleFavorite={(e) => handleRemoveFavorite(persona.id, e)}
                c={c}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
