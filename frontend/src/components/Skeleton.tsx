import { useThemeColors } from '../hooks/useThemeColors'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '6px', style }: SkeletonProps) {
  const c = useThemeColors()
  return (
    <div style={{
      width, height, borderRadius,
      background: c.isDark ? '#374151' : '#e5e7eb',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      ...style,
    }} />
  )
}

export function SkeletonCard({ c }: { c: ReturnType<typeof useThemeColors> }) {
  return (
    <div style={{ background: c.bgCard, borderRadius: '16px', padding: '1.25rem', border: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: c.isDark ? '#374151' : '#e5e7eb', flexShrink: 0, animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ height: '0.875rem', width: '55%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          <div style={{ height: '0.6875rem', width: '30%', borderRadius: '999px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem' }}>
        <div style={{ height: '0.8125rem', width: '100%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '0.8125rem', width: '75%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ height: '0.75rem', width: '40%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.45 } }`}</style>
    </div>
  )
}

export function SkeletonRow({ c }: { c: ReturnType<typeof useThemeColors> }) {
  return (
    <div style={{ background: c.bgCard, borderRadius: '14px', padding: '1.125rem 1.25rem', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div style={{ height: '0.875rem', width: '45%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '0.75rem', width: '65%', borderRadius: '6px', background: c.isDark ? '#374151' : '#e5e7eb', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.45 } }`}</style>
    </div>
  )
}
