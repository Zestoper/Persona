import type { ReactNode } from 'react'
import { useThemeColors } from '../hooks/useThemeColors'

// 로그인 화면과 같은 모양의 카드 — 비밀번호 찾기 · 재설정 화면에서 같이 쓴다
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const c = useThemeColors()
  return (
    <div style={{ minHeight: '100vh', background: c.isDark ? '#0f172a' : 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.125rem' }}>P</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: c.textPrimary, marginBottom: '0.25rem' }}>Persona</h1>
        </div>
        <div style={{ background: c.bgCard, borderRadius: '24px', boxShadow: c.isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.10)', border: `1px solid ${c.border}`, padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: c.textPrimary, marginBottom: subtitle ? '0.375rem' : '1.5rem' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '0.875rem', color: c.textSecondary, marginBottom: '1.5rem', lineHeight: 1.6 }}>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
