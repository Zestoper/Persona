import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../api/client'

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

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider 안에서만 사용 가능합니다.')
  return context
}
