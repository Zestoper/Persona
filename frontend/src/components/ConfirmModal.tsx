import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  message: string
  subMessage?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ message, subMessage, confirmLabel = '확인', danger = false, onConfirm, onCancel }: Props) {
  const c = useThemeColors()

  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: c.bgCard, borderRadius: '18px', padding: '1.75rem 1.5rem 1.5rem', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: `1px solid ${c.border}` }}
      >
        <p style={{ fontWeight: 700, color: c.textPrimary, fontSize: '1rem', margin: '0 0 0.5rem 0', lineHeight: 1.45 }}>
          {message}
        </p>
        {subMessage && (
          <p style={{ color: c.textMuted, fontSize: '0.875rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            {subMessage}
          </p>
        )}
        {!subMessage && <div style={{ height: '1.25rem' }} />}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '0.6875rem', borderRadius: '12px', border: `1.5px solid ${c.border}`, background: c.bgSoft, color: c.textSecondary, fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '0.6875rem', borderRadius: '12px', border: 'none', background: danger ? '#ef4444' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(99,102,241,0.3)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
