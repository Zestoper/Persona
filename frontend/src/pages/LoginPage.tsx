import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useThemeColors } from '../hooks/useThemeColors'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const c = useThemeColors()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      await login(res.data.access_token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`,
    borderRadius: '12px', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', background: c.bgInput, color: c.textPrimary,
  }

  return (
    <div style={{ minHeight: '100vh', background: c.isDark ? '#0f172a' : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', transition: 'background 0.2s ease' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.03em' }}>P</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.textPrimary, marginBottom: '0.25rem' }}>Persona</h1>
          <p style={{ fontSize: '0.875rem', color: c.textSecondary }}>나만의 AI 캐릭터를 만들어보세요</p>
        </div>

        <div style={{ background: c.bgCard, borderRadius: '24px', boxShadow: c.isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.10)', border: `1px solid ${c.border}`, padding: '2.5rem', transition: 'background 0.2s ease' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: c.textPrimary, marginBottom: '1.5rem' }}>로그인</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }}>이메일</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="example@email.com" required style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }}>비밀번호</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                placeholder="비밀번호 입력" required style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

            {error && (
              <div style={{ background: c.isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${c.isDark ? '#7f1d1d' : '#fecaca'}`, color: c.isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              style={{ width: '100%', background: isLoading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '0.375rem', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)' }}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 구분선 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: c.border }} />
            <span style={{ fontSize: '0.8125rem', color: c.textMuted, whiteSpace: 'nowrap' }}>또는</span>
            <div style={{ flex: 1, height: '1px', background: c.border }} />
          </div>

          {/* 소셜 로그인 버튼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <a
              href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/auth/kakao`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', background: '#FEE500', color: '#191919', border: 'none', borderRadius: '12px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.1 1.28 3.94 3.22 5.04l-.82 3.04 3.5-2.3c.52.07 1.05.12 1.6.12 4.14 0 7.5-2.69 7.5-6S13.14 1.5 9 1.5z" fill="#191919"/></svg>
              카카오로 로그인
            </a>
            <a
              href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/auth/google`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', background: c.bgCard, color: c.textPrimary, border: `1.5px solid ${c.borderStrong}`, borderRadius: '12px', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              구글로 로그인
            </a>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: c.textMuted, marginTop: '1.5rem' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
