import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 구글/카카오 로그인 후 백엔드가 /oauth/callback#token=... 으로 보내준다.
// 토큰으로 내 정보를 받아 로그인 상태로 만든 뒤 마켓플레이스로 이동한다.
export default function OAuthCallbackPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const done = useRef(false) // 개발 모드(StrictMode)에서 effect 가 두 번 도는 것 방지

  useEffect(() => {
    if (done.current) return
    done.current = true

    const fail = (message: string) =>
      navigate(`/login?oauth_error=${encodeURIComponent(message)}`, { replace: true })

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    // 주소창에서 토큰을 지운다 (뒤로가기·복사로 새지 않게)
    window.history.replaceState(null, '', window.location.pathname)

    if (!token) {
      fail('로그인 정보를 받지 못했습니다.')
      return
    }

    login(token)
      .then(() => navigate('/marketplace', { replace: true }))
      .catch((err: unknown) => {
        localStorage.removeItem('token')
        fail(err instanceof Error && err.message.includes('정지') ? err.message : '로그인에 실패했습니다. 다시 시도해주세요.')
      })
  }, [login, navigate])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>로그인 처리 중...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
