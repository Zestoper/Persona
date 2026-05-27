import { useNavigate } from 'react-router-dom'
import { useThemeColors } from '../hooks/useThemeColors'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const c = useThemeColors()

  return (
    <div style={{ minHeight: '100vh', background: c.bgPage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', transition: 'background 0.2s ease' }}>
      <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>P</span>
      </div>

      <p style={{ fontSize: '5rem', fontWeight: 800, color: c.isDark ? '#374151' : '#e5e7eb', lineHeight: 1, marginBottom: '1rem' }}>404</p>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: c.textPrimary, marginBottom: '0.5rem' }}>페이지를 찾을 수 없어요</h1>
      <p style={{ color: c.textMuted, fontSize: '0.9375rem', marginBottom: '2rem' }}>
        주소가 잘못됐거나 삭제된 페이지예요
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '0.625rem 1.25rem', border: `1.5px solid ${c.border}`, borderRadius: '12px', background: c.bgCard, color: c.textSecondary, fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}
        >
          이전으로
        </button>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '0.625rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 600, fontSize: '0.9375rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
        >
          홈으로
        </button>
      </div>
    </div>
  )
}
