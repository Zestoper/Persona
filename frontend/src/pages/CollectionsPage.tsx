import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useIsMobile } from '../hooks/useIsMobile'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'

interface Collection {
  id: number
  title: string
  description: string | null
  emoji: string | null
  is_featured: boolean
  persona_count: number
  created_at: string
}

export default function CollectionsPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const c = useThemeColors()
  const { showToast } = useToast()

  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/collections')
      .then((res) => setCollections(res.data))
      .catch(() => showToast('컬렉션을 불러오는 데 실패했어요', 'error'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      {/* 헤더 */}
      <div style={{ background: c.bgHero, padding: isMobile ? '2rem 1rem 1.5rem' : '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Collections</p>
          <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            큐레이션 컬렉션
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.875rem' : '0.9375rem' }}>
            테마별로 엄선된 AI 페르소나 모음이에요
          </p>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: '160px', background: c.bgCard, borderRadius: '16px', border: `1px solid ${c.border}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ color: c.textSecondary, fontSize: '1rem' }}>아직 등록된 컬렉션이 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {collections.map((col) => (
              <CollectionCard
                key={col.id}
                collection={col}
                onClick={() => navigate(`/collections/${col.id}`)}
                c={c}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
    </div>
  )
}

function CollectionCard({
  collection,
  onClick,
  c,
}: {
  collection: Collection
  onClick: () => void
  c: ReturnType<typeof useThemeColors>
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.bgCard,
        border: `1px solid ${hovered ? c.borderHover : c.border}`,
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hovered ? c.shadowHover : c.shadowCard,
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* 이모지 + 제목 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: c.isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
          {collection.emoji || '📚'}
        </div>
        <div>
          <h3 style={{ margin: 0, color: c.textPrimary, fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
            {collection.title}
          </h3>
          {collection.is_featured && (
            <span style={{ display: 'inline-block', marginTop: '0.25rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '99px', letterSpacing: '0.02em' }}>
              FEATURED
            </span>
          )}
        </div>
      </div>

      {/* 설명 */}
      {collection.description && (
        <p style={{ margin: 0, color: c.textSecondary, fontSize: '0.875rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {collection.description}
        </p>
      )}

      {/* 페르소나 수 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 'auto' }}>
        <span style={{ fontSize: '0.75rem', color: c.textMuted }}>🤖</span>
        <span style={{ fontSize: '0.8125rem', color: c.textMuted, fontWeight: 500 }}>
          페르소나 {collection.persona_count}개
        </span>
      </div>
    </div>
  )
}
