import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [logoutHovered, setLogoutHovered] = useState(false)

  return (
    <nav style={{ background: 'white', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ padding: isMobile ? '0 1rem' : '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* 로고 */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.35)', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>P</span>
          </div>
          <span style={{ fontWeight: 800, color: '#111827', fontSize: '1.125rem', letterSpacing: '-0.02em' }}>Persona</span>
        </Link>

        {/* 메뉴 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem' }}>
          {user ? (
            <>
              {!isMobile && (
                <Link to="/profile" style={{ fontSize: '0.9375rem', color: location.pathname === '/profile' ? '#6366f1' : '#9ca3af', textDecoration: 'none', fontWeight: location.pathname === '/profile' ? 600 : 400 }}>
                  {user.nickname}
                </Link>
              )}
              {!isMobile && (
                <Link to="/my" style={{ fontSize: '0.9375rem', color: '#374151', fontWeight: 500, textDecoration: 'none', padding: '0.5rem 0.875rem' }}>
                  내 페르소나
                </Link>
              )}
              {isMobile && (
                <Link to="/my" style={{ fontSize: '0.8125rem', color: '#374151', fontWeight: 500, textDecoration: 'none', padding: '0.4rem 0.625rem' }}>
                  내 페르소나
                </Link>
              )}
              <button
                onClick={() => navigate('/create')}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: isMobile ? '0.8125rem' : '0.9375rem', fontWeight: 600, padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }}
              >
                {isMobile ? '+' : '+ 만들기'}
              </button>
              {!isMobile && (
                <button
                  onClick={logout}
                  onMouseEnter={() => setLogoutHovered(true)}
                  onMouseLeave={() => setLogoutHovered(false)}
                  style={{ fontSize: '0.875rem', color: logoutHovered ? '#374151' : '#d1d5db', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  로그아웃
                </button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: isMobile ? '0.8125rem' : '0.9375rem', color: '#374151', fontWeight: 500, textDecoration: 'none', padding: isMobile ? '0.4rem 0.625rem' : '0.5rem 0.875rem' }}>
                로그인
              </Link>
              <Link
                to="/register"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: isMobile ? '0.8125rem' : '0.9375rem', fontWeight: 600, padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1.25rem', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }}
              >
                시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
