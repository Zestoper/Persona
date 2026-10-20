import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import api from '../api/client'
import AuthCard from '../components/AuthCard'
import { useThemeColors } from '../hooks/useThemeColors'

// 메일로 받은 링크(/reset-password?token=...)로 들어와 새 비밀번호를 정하는 화면
export default function ResetPasswordPage() {
  const c = useThemeColors()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [valid, setValid] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) { setValid(false); return }
    api.get('/auth/password-reset/check', { params: { token } })
      .then((res) => setValid(!!res.data.valid))
      .catch(() => setValid(false))
  }, [token])

  const mismatch = pw2.length > 0 && pw !== pw2
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`, borderRadius: '12px',
    fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', background: c.bgInput, color: c.textPrimary,
  }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw !== pw2) { setError('새 비밀번호가 서로 다릅니다.'); return }
    setError('')
    setIsLoading(true)
    try {
      await api.post('/auth/password-reset/confirm', { token, new_password: pw, new_password_confirm: pw2 })
      navigate('/login', { state: { message: '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.' } })
    } catch (err: any) {
      setError(err.response?.data?.detail || '변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard title="비밀번호 재설정" subtitle="새 비밀번호를 8자 이상으로 입력해 주세요.">
      {valid === null && <p style={{ color: c.textMuted, fontSize: '0.875rem' }}>링크를 확인하는 중이에요...</p>}

      {valid === false && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center', color: '#ef4444', padding: '0.5rem 0 1rem' }}>
          <ShieldAlert size={36} strokeWidth={1.6} />
          <p style={{ color: c.textPrimary, fontSize: '0.9375rem' }}>링크가 만료됐거나 이미 사용됐어요.</p>
          <Link to="/forgot-password" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>비밀번호 찾기 다시 요청</Link>
        </div>
      )}

      {valid && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          <div>
            <label style={labelStyle}>새 비밀번호</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required autoComplete="new-password" placeholder="8자 이상" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>새 비밀번호 확인</label>
            <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required autoComplete="new-password" placeholder="한 번 더 입력" style={inputStyle} />
          </div>
          {(error || mismatch) && (
            <div style={{ background: c.isDark ? '#450a0a' : '#fef2f2', color: c.isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px' }}>
              {error || '비밀번호가 서로 달라요.'}
            </div>
          )}
          <button type="submit" disabled={isLoading || mismatch || pw.length < 8}
            style={{ width: '100%', background: isLoading || mismatch || pw.length < 8 ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? '바꾸는 중...' : '비밀번호 바꾸기'}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
        <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size="1em" style={{ verticalAlign: '-0.125em' }} /> 로그인으로 돌아가기
        </Link>
      </p>
    </AuthCard>
  )
}
