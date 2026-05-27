// ── 인증 전역 상태 관리 ────────────────────────────────────
// 비유: 앱 전체에서 쓸 수 있는 '로그인 여부' 전광판.
//       어느 페이지에서도 "지금 로그인 되어있나?" 를 바로 확인 가능.
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api/client'

// ── 타입 정의 ─────────────────────────────────────────────
interface User {
  id: number
  email: string
  nickname: string
  is_admin: boolean
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  updateUser: (updated: Partial<User>) => void
}

// ── Context 생성 ───────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

// ── Provider 컴포넌트 ──────────────────────────────────────
// 비유: 전광판을 설치하는 것. 이 컴포넌트로 감싸면 안에서 다 볼 수 있음.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true) // 앱 시작 시 토큰 확인 중

  // ── 앱 시작 시 토큰이 있으면 자동 로그인 ─────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data.is_active === false) {
            localStorage.removeItem('token')
          } else {
            setUser(res.data)
          }
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  // ── 로그인 ────────────────────────────────────────────────
  const login = async (token: string) => {
    localStorage.setItem('token', token)
    const res = await api.get('/auth/me')
    if (res.data.is_active === false) {
      localStorage.removeItem('token')
      throw new Error('계정이 정지됐습니다. 관리자에게 문의하세요.')
    }
    setUser(res.data)
  }

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...updated } : null)
  }

  // ── 로그아웃 ──────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token') // 토큰 삭제
    setUser(null)                    // 전역 상태 초기화
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── 커스텀 훅 ─────────────────────────────────────────────
// 다른 컴포넌트에서 `const { user } = useAuth()` 로 간편하게 사용
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider 안에서만 사용 가능합니다.')
  return context
}
