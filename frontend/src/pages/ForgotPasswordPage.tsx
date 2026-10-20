import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import api from '../api/client'
import AuthCard from '../components/AuthCard'
import { useThemeColors } from '../hooks/useThemeColors'

// 비밀번호 찾기 — 가입 이메일로 30분·1회용 재설정 링크를 보낸다 (가입 여부는 화면에 드러내지 않음)
export default function ForgotPasswordPage() {
  const c = useThemeColors()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post('/auth/password-reset/request', { email })
      setSent(res.data.message)
    } catch (err: any) {
      setError(err.response?.data?.detail || '요청에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard title="비밀번호 찾기" subtitle="가입한 이메일로 비밀번호 재설정 링크를 보내 드려요.">
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', color: '#6366f1', padding: '0.5rem 0 1rem' }}>
          <MailCheck size={36} strokeWidth={1.6} />
          <p style={{ color: c.textPrimary, fontSize: '0.9375rem', lineHeight: 1.7 }}>{sent}</p>
          <p style={{ color: c.textMuted, fontSize: '0.8125rem' }}>링크는 30분 동안 한 번만 쓸 수 있어요.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }}>가입 이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required autoComplete="email"
              style={{ width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`, borderRadius: '12px', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', background: c.bgInput, color: c.textPrimary }} />
          </div>
          {error && <div style={{ background: c.isDark ? '#450a0a' : '#fef2f2', color: c.isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px' }}>{error}</div>}
          <button type="submit" disabled={isLoading}
            style={{ width: '100%', background: isLoading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? '보내는 중...' : '재설정 링크 받기'}
          </button>
          <p style={{ fontSize: '0.75rem', color: c.textMuted, textAlign: 'center', lineHeight: 1.6 }}>
            카카오·구글로 가입했다면 로그인 화면의 소셜 로그인 버튼을 이용해 주세요.
          </p>
        </form>
      )}
      <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> 로그인으로 돌아가기
        </Link>
      </p>
    </AuthCard>
  )
}
