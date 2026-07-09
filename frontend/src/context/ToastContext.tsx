import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  leaving: boolean
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type, leaving: false }])

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, leaving: true } : t))
    }, 2500)

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const colors: Record<ToastType, { bg: string; border: string; icon: string; color: string }> = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✓', color: '#16a34a' },
    error:   { bg: '#fef2f2', border: '#fecaca', icon: '✕', color: '#dc2626' },
    info:    { bg: '#eef2ff', border: '#c7d2fe', icon: 'i', color: '#6366f1' },
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
        {toasts.map((toast) => {
          const c = colors[toast.type]
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                background: c.bg, border: `1.5px solid ${c.border}`,
                borderRadius: '12px', padding: '0.75rem 1rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                animation: toast.leaving ? 'toastOut 0.4s ease forwards' : 'toastIn 0.3s ease',
                minWidth: '220px', maxWidth: '320px',
              }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                {c.icon}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.4 }}>{toast.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider 안에서만 사용 가능합니다.')
  return ctx
}
