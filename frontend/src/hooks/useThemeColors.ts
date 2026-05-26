import { useTheme } from '../context/ThemeContext'

export function useThemeColors() {
  const { isDark } = useTheme()
  return {
    isDark,
    bgPage:     isDark ? '#0f172a' : '#f8f9fc',
    bgCard:     isDark ? '#1e293b' : 'white',
    bgSoft:     isDark ? '#1e293b' : '#f3f4f6',
    bgSofter:   isDark ? '#162032' : '#f8f9fc',
    bgInput:    isDark ? '#1e293b' : 'white',
    bgNavbar:   isDark ? '#0f172a' : 'white',
    bgHero:     isDark ? 'linear-gradient(135deg, #3730a3 0%, #5b21b6 100%)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    textPrimary:   isDark ? '#f1f5f9' : '#111827',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    textMuted:     isDark ? '#64748b' : '#9ca3af',
    textLabel:     isDark ? '#cbd5e1' : '#374151',
    border:        isDark ? '#334155' : '#f0f0f0',
    borderStrong:  isDark ? '#475569' : '#e5e7eb',
    borderNav:     isDark ? '#1e293b' : '#f0f0f0',
    borderHover:   isDark ? '#6366f1' : '#c7d2fe',
    shadowCard:    isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
    shadowHover:   isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(99,102,241,0.10)',
  }
}
