import { useState } from 'react'
import PersonaAvatar from './PersonaAvatar'
import { useThemeColors } from '../hooks/useThemeColors'

export interface PersonaCardData {
  id: number
  name: string
  personality: string
  speech_style: string | null
  chat_count: number
  avatar_url: string | null
  tags: string | null
  creator_nickname: string | null
}

export default function PersonaCard({
  persona, isFavorited, onClick, onToggleFavorite, c,
}: {
  persona: PersonaCardData
  isFavorited: boolean
  onClick: () => void
  onToggleFavorite: (e: React.MouseEvent) => void
  c: ReturnType<typeof useThemeColors>
}) {
  const [hovered, setHovered] = useState(false)
  const tags = persona.tags ? persona.tags.split(',').filter(Boolean) : []

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: c.bgCard,
        borderRadius: '16px',
        padding: '1.25rem',
        border: hovered ? `1.5px solid ${c.borderHover}` : `1.5px solid ${c.border}`,
        boxShadow: hovered ? c.shadowHover : c.shadowCard,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        position: 'relative',
      }}
    >
      <button
        onClick={onToggleFavorite}
        style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1rem', color: isFavorited ? '#ef4444' : c.textMuted,
          padding: '0.25rem', lineHeight: 1,
          transition: 'color 0.15s, transform 0.15s',
          transform: isFavorited ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        {isFavorited ? '♥' : '♡'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '1.5rem' }}>
        <PersonaAvatar name={persona.name} avatarUrl={persona.avatar_url} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 600, color: hovered ? '#6366f1' : c.textPrimary, fontSize: '0.9375rem', margin: '0 0 0.25rem 0', transition: 'color 0.18s' }}>
            {persona.name}
          </h3>
          {persona.speech_style && (
            <span style={{ fontSize: '0.6875rem', color: '#6366f1', background: c.isDark ? '#312e81' : '#eef2ff', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 500 }}>
              {persona.speech_style}
            </span>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', color: c.textSecondary, lineHeight: 1.55, margin: '0 0 0.75rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {persona.personality}
      </p>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ fontSize: '0.6875rem', color: c.textMuted, background: c.bgSoft, padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <span style={{ fontSize: '0.75rem', color: c.textMuted }}>
            대화 {persona.chat_count.toLocaleString()}회
          </span>
          {persona.creator_nickname && (
            <span style={{ fontSize: '0.6875rem', color: c.textMuted }}>
              by {persona.creator_nickname}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8125rem', color: hovered ? '#6366f1' : c.textMuted, fontWeight: 600, transition: 'color 0.18s' }}>
          대화하기 →
        </span>
      </div>
    </div>
  )
}
