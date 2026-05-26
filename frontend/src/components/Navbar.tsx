import { useState, useEffect } from 'react'
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

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // 메뉴 열릴 때 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const activeColor = (path: string) => location.pathname === path ? '#6366f1' : c.textLabel
  const activeWeight = (path: string) => location.pathname === path ? 600 : 500

  return (
    <>
      <nav style={{ background: c.bgNavbar, borderBottom: `1px solid ${c.borderNav}`, position: 'sticky', top: 0, zIndex: 50, transition: 'background 0.2s ease' }}>
        <div style={{ padding: isMobile ? '0 1rem' : '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* 로고 */}
          <Link to={user ? '/marketplace' : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.35)', flexShrink: 0 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>P</span>
            </div>
            <span style={{ fontWeight: 800, color: c.textPrimary, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>Persona</span>
          </Link>

          {/* 데스크탑 메뉴 */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/pricing" style={{ fontSize: '0.9375rem', color: activeColor('/pricing'), fontWeight: activeWeight('/pricing'), textDecoration: 'none', padding: '0.5rem 0.875rem' }}>요금제</Link>

              {user ? (
                <>
                  <Link to="/marketplace" style={{ fontSize: '0.9375rem', color: activeColor('/marketplace'), fontWeight: activeWeight('/marketplace'), textDecoration: 'none', padding: '0.5rem 0.875rem' }}>마켓</Link>
                  <Link to="/my" style={{ fontSize: '0.9375rem', color: activeColor('/my'), fontWeight: activeWeight('/my'), textDecoration: 'none', padding: '0.5rem 0.875rem' }}>내 페르소나</Link>
                  <Link to="/conversations" style={{ fontSize: '0.9375rem', color: activeColor('/conversations'), fontWeight: activeWeight('/conversations'), textDecoration: 'none', padding: '0.5rem 0.875rem' }}>대화 목록</Link>
                  {user.is_admin && (
                    <Link to="/admin" style={{ fontSize: '0.9375rem', color: location.pathname === '/admin' ? '#7c3aed' : c.textMuted, fontWeight: activeWeight('/admin'), textDecoration: 'none', padding: '0.5rem 0.875rem' }}>관리자</Link>
                  )}
                  <button onClick={toggleTheme} style={darkBtn(c)}>{isDark ? '☀️' : '🌙'}</button>
                  <Link to="/profile" style={{ fontSize: '0.875rem', color: c.textMuted, textDecoration: 'none', padding: '0.5rem' }}>{user.nickname}</Link>
                  <button onClick={() => navigate('/create')} style={createBtn(false)}>+ 만들기</button>
                  <button onClick={logout} style={{ fontSize: '0.875rem', color: c.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>로그아웃</button>
                </>
              ) : (
                <>
                  <button onClick={toggleTheme} style={darkBtn(c)}>{isDark ? '☀️' : '🌙'}</button>
                  <Link to="/login" style={{ fontSize: '0.9375rem', color: c.textLabel, fontWeight: 500, textDecoration: 'none', padding: '0.5rem 0.875rem' }}>로그인</Link>
                  <Link to="/register" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.9375rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>시작하기</Link>
                </>
              )}
            </div>
          )}

          {/* 모바일 우측 버튼들 */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <button onClick={toggleTheme} style={darkBtn(c)}>{isDark ? '☀️' : '🌙'}</button>
              {user && (
                <button onClick={() => navigate('/create')} style={createBtn(true)}>+</button>
              )}
              {/* 햄버거 버튼 */}
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
          {/* 배경 오버레이 */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            />
          )}

          {/* 슬라이드 메뉴 */}
          <div style={{
            position: 'fixed', top: '64px', right: 0, bottom: 0, width: '260px',
            background: c.bgCard, zIndex: 45,
            transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s ease',
            boxShadow: menuOpen ? '-8px 0 24px rgba(0,0,0,0.15)' : 'none',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}>
            <div style={{ padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>

              {user && (
                <>
                  <div style={{ padding: '0.75rem 0.875rem', marginBottom: '0.5rem', background: c.bgSoft, borderRadius: '12px' }}>
                    <p style={{ fontWeight: 600, color: c.textPrimary, margin: '0 0 0.125rem 0', fontSize: '0.9375rem' }}>{user.nickname}</p>
                    <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: 0 }}>{user.is_admin ? '관리자' : 'Free 플랜'}</p>
                  </div>
                  <Divider c={c} />
                </>
              )}

              <MenuLink to="/marketplace" label="마켓플레이스" icon="🛍️" c={c} active={location.pathname === '/marketplace'} />
              <MenuLink to="/pricing" label="요금제" icon="💎" c={c} active={location.pathname === '/pricing'} />

              {user ? (
                <>
                  <Divider c={c} />
                  <MenuLink to="/my" label="내 페르소나" icon="🤖" c={c} active={location.pathname === '/my'} />
                  <MenuLink to="/conversations" label="대화 목록" icon="💬" c={c} active={location.pathname === '/conversations'} />
                  <MenuLink to="/profile" label="프로필" icon="👤" c={c} active={location.pathname === '/profile'} />
                  {user.is_admin && <MenuLink to="/admin" label="관리자" icon="⚙️" c={c} active={location.pathname === '/admin'} />}
                  <Divider c={c} />
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    style={{ padding: '0.75rem 0.875rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: '#ef4444', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  >
                    <span>🚪</span> 로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Divider c={c} />
                  <MenuLink to="/login" label="로그인" icon="🔑" c={c} active={location.pathname === '/login'} />
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link
                      to="/register"
                      style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, padding: '0.875rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9375rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                    >
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

function MenuLink({ to, label, icon, c, active }: { to: string; label: string; icon: string; c: ReturnType<typeof useThemeColors>; active: boolean }) {
  return (
    <Link
      to={to}
      style={{ padding: '0.75rem 0.875rem', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', background: active ? (c.isDark ? '#312e81' : '#eef2ff') : 'transparent', color: active ? '#6366f1' : c.textLabel, fontWeight: active ? 600 : 500, fontSize: '0.9375rem', transition: 'background 0.15s' }}
    >
      <span>{icon}</span> {label}
    </Link>
  )
}

function Divider({ c }: { c: ReturnType<typeof useThemeColors> }) {
  return <div style={{ height: '1px', background: c.border, margin: '0.5rem 0' }} />
}

function darkBtn(c: ReturnType<typeof useThemeColors>): React.CSSProperties {
  return { background: c.bgSoft, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '0.375rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer', flexShrink: 0 }
}

function createBtn(isMobile: boolean): React.CSSProperties {
  return { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: isMobile ? '1rem' : '0.9375rem', fontWeight: 700, padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', whiteSpace: 'nowrap' }
}
