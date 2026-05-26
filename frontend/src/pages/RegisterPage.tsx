import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useThemeColors } from '../hooks/useThemeColors'

export default function RegisterPage() {
  const navigate = useNavigate()
  const c = useThemeColors()
  const [form, setForm] = useState({ email: '', password: '', nickname: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`,
    borderRadius: '12px', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', background: c.bgInput, color: c.textPrimary,
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: c.isDark ? '#0f172a' : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    transition: 'background 0.2s ease',
  }

  const logoBlock = (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '1.125rem' }}>P</span>
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.textPrimary, marginBottom: '0.25rem' }}>Persona</h1>
      <p style={{ fontSize: '0.875rem', color: c.textSecondary }}>나만의 AI 캐릭터를 만들어보세요</p>
    </div>
  )

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {logoBlock}
          <div style={{ background: c.bgCard, borderRadius: '24px', boxShadow: c.isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.10)', border: `1px solid ${c.border}`, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: c.textPrimary, marginBottom: '0.5rem' }}>가입 완료!</h2>
            <p style={{ fontSize: '0.9375rem', color: c.textSecondary, marginBottom: '2rem', lineHeight: 1.6 }}>
              <strong style={{ color: c.textPrimary }}>{form.nickname}</strong>님, 환영해요.<br />
              지금 바로 나만의 AI 캐릭터를 만들어보세요.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
            >
              로그인하러 가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {logoBlock}
        <div style={{ background: c.bgCard, borderRadius: '24px', boxShadow: c.isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.10)', border: `1px solid ${c.border}`, padding: '2.5rem', transition: 'background 0.2s ease' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: c.textPrimary, marginBottom: '1.5rem' }}>회원가입</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }}>닉네임</label>
              <input type="text" name="nickname" value={form.nickname} onChange={handleChange}
                placeholder="2~20자" required style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

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
                placeholder="8자 이상" required style={inputStyle}
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
              {isLoading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: c.textMuted, marginTop: '1.5rem' }}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
