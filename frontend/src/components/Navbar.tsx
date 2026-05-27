import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'
import { useThemeColors } from '../hooks/useThemeColors'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { toggleTheme, isDark } = useTheme()
  const c = useThemeColors()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path: string) => location.pathname === path

  const navLink = (path: string): React.CSSProperties => ({
    fontSize: '0.9375rem',
    color: isActive(path) ? '#6366f1' : c.textLabel,
    fontWeight: isActive(path) ? 600 : 500,
    textDecoration: 'none',
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
    background: isActive(path) ? (c.isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)') : 'transparent',
    transition: 'background 0.15s',
  })

  return (
    <>
      <nav style={{ background: c.bgNavbar, borderBottom: `1px solid ${c.borderNav}`, position: 'sticky', top: 0, zIndex: 50, transition: 'background 0.2s ease' }}>
        <div style={{ padding: isMobile ? '0 1rem' : '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          {/* 로고 */}
          <Link to={user ? '/marketplace' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>P</span>
            </div>
            <span style={{ fontWeight: 800, color: c.textPrimary, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>Persona</span>
          </Link>

          {/* 데스크탑 */}
          {!isMobile && (
            <>
              {/* 중앙 네비 링크 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, paddingLeft: '1.5rem' }}>
                {user && <Link to="/marketplace" style={navLink('/marketplace')}>마켓</Link>}
                {user && <Link to="/my" style={navLink('/my')}>내 페르소나</Link>}
                {user && <Link to="/favorites" style={navLink('/favorites')}>즐겨찾기</Link>}
                {user && <Link to="/conversations" style={navLink('/conversations')}>대화 목록</Link>}
                <Link to="/pricing" style={navLink('/pricing')}>요금제</Link>
              </div>

              {/* 우측 액션 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                {/* 다크모드 */}
                <button onClick={toggleTheme} style={{ background: c.bgSoft, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '0.375rem 0.625rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  {isDark ? '☀️' : '🌙'}
                </button>

                {user ? (
                  <>
                    {/* + 만들기 */}
                    <button onClick={() => navigate('/create')} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.9375rem', fontWeight: 600, padding: '0.4375rem 1.125rem', borderRadius: '9px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }}>
                      + 만들기
                    </button>

                    {/* 유저 드롭다운 */}
                    <div ref={dropRef} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setDropOpen((o) => !o)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: dropOpen ? c.bgSoft : 'transparent', border: `1px solid ${dropOpen ? c.borderStrong : 'transparent'}`, borderRadius: '9px', padding: '0.375rem 0.625rem 0.375rem 0.75rem', cursor: 'pointer', color: c.textPrimary, fontSize: '0.9375rem', fontWeight: 500, transition: 'all 0.15s' }}
                      >
                        <span>{user.nickname}</span>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                          <path d="M2 4l4 4 4-4" stroke={c.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {dropOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: '168px', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '0.375rem', zIndex: 100 }}>
                          <DropItem to="/profile" label="프로필" icon="👤" c={c} onClick={() => setDropOpen(false)} />
                          {user.is_admin && <DropItem to="/admin" label="관리자" icon="⚙️" c={c} onClick={() => setDropOpen(false)} />}
                          <div style={{ height: '1px', background: c.border, margin: '0.25rem 0' }} />
                          <button
                            onClick={() => { setDropOpen(false); logout() }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.9375rem', borderRadius: '8px', textAlign: 'left' }}
                          >
                            <span>🚪</span> 로그아웃
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ fontSize: '0.9375rem', color: c.textLabel, fontWeight: 500, textDecoration: 'none', padding: '0.4375rem 0.875rem' }}>로그인</Link>
                    <Link to="/register" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.9375rem', fontWeight: 600, padding: '0.4375rem 1.125rem', borderRadius: '9px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>시작하기</Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* 모바일 우측 */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button onClick={toggleTheme} style={{ background: c.bgSoft, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '0.375rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                {isDark ? '☀️' : '🌙'}
              </button>
              {user && (
                <button onClick={() => navigate('/create')} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '1rem', fontWeight: 700, padding: '0.375rem 0.75rem', borderRadius: '9px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>+</button>
              )}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '5px' }}
              >
                <span style={{ display: 'block', width: '20px', height: '2px', background: c.textPrimary, borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ display: 'block', width: '20px', height: '2px', background: c.textPrimary, borderRadius: '2px', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: '20px', height: '2px', background: c.textPrimary, borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 모바일 드로어 */}
      {isMobile && (
        <>
          {menuOpen && (
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
          )}
          <div style={{
            position: 'fixed', top: '64px', right: 0, bottom: 0, width: '260px',
            background: c.bgCard, zIndex: 45,
            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s ease',
            boxShadow: menuOpen ? '-8px 0 24px rgba(0,0,0,0.15)' : 'none',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              {user && (
                <>
                  <div style={{ padding: '0.75rem 0.875rem', marginBottom: '0.5rem', background: c.bgSoft, borderRadius: '12px' }}>
                    <p style={{ fontWeight: 600, color: c.textPrimary, margin: '0 0 0.125rem 0', fontSize: '0.9375rem' }}>{user.nickname}</p>
                    <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: 0 }}>{user.is_admin ? '관리자' : 'Free 플랜'}</p>
                  </div>
                  <div style={{ height: '1px', background: c.border, margin: '0.25rem 0' }} />
                </>
              )}

              <MenuLink to="/marketplace" label="마켓플레이스" icon="🛍️" c={c} active={isActive('/marketplace')} />
              {user && <MenuLink to="/my" label="내 페르소나" icon="🤖" c={c} active={isActive('/my')} />}
              {user && <MenuLink to="/favorites" label="즐겨찾기" icon="♥" c={c} active={isActive('/favorites')} />}
              {user && <MenuLink to="/conversations" label="대화 목록" icon="💬" c={c} active={isActive('/conversations')} />}
              <MenuLink to="/pricing" label="요금제" icon="💎" c={c} active={isActive('/pricing')} />

              {user ? (
                <>
                  <div style={{ height: '1px', background: c.border, margin: '0.25rem 0' }} />
                  <MenuLink to="/profile" label="프로필" icon="👤" c={c} active={isActive('/profile')} />
                  {user.is_admin && <MenuLink to="/admin" label="관리자" icon="⚙️" c={c} active={isActive('/admin')} />}
                  <div style={{ height: '1px', background: c.border, margin: '0.25rem 0' }} />
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    style={{ padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <span>🚪</span> 로그아웃
                  </button>
                </>
              ) : (
                <>
                  <div style={{ height: '1px', background: c.border, margin: '0.25rem 0' }} />
                  <MenuLink to="/login" label="로그인" icon="🔑" c={c} active={isActive('/login')} />
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link to="/register" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, padding: '0.875rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9375rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                      무료로 시작하기
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function DropItem({ to, label, icon, c, onClick }: { to: string; label: string; icon: string; c: ReturnType<typeof useThemeColors>; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: '8px', textDecoration: 'none', color: c.textLabel, fontSize: '0.9375rem', fontWeight: 500 }}
    >
      <span>{icon}</span> {label}
    </Link>
  )
}

function MenuLink({ to, label, icon, c, active }: { to: string; label: string; icon: string; c: ReturnType<typeof useThemeColors>; active: boolean }) {
  return (
    <Link
      to={to}
      style={{ padding: '0.75rem 0.875rem', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', background: active ? (c.isDark ? '#312e81' : '#eef2ff') : 'transparent', color: active ? '#6366f1' : c.textLabel, fontWeight: active ? 600 : 500, fontSize: '0.9375rem' }}
    >
      <span>{icon}</span> {label}
    </Link>
  )
}
