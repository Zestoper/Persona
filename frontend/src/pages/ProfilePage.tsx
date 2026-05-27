import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import ConfirmModal from '../components/ConfirmModal'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { showToast } = useToast()
  const isMobile = useIsMobile()
  const c = useThemeColors()

  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [nicknameMsg, setNicknameMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isNicknameSaving, setIsNicknameSaving] = useState(false)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [isPwSaving, setIsPwSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleNicknameSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setNicknameMsg(null)
    setIsNicknameSaving(true)
    try {
      const res = await api.put('/auth/me', { nickname })
      updateUser({ nickname: res.data.nickname })
      setNicknameMsg({ text: '닉네임이 변경됐어요.', ok: true })
    } catch (err: any) {
      setNicknameMsg({ text: err.response?.data?.detail || '변경에 실패했습니다.', ok: false })
    } finally {
      setIsNicknameSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pw.next !== pw.confirm) {
      setPwMsg({ text: '새 비밀번호가 일치하지 않아요.', ok: false })
      return
    }
    setIsPwSaving(true)
    try {
      await api.put('/auth/me/password', { current_password: pw.current, new_password: pw.next })
      setPwMsg({ text: '비밀번호가 변경됐어요.', ok: true })
      setPw({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      setPwMsg({ text: err.response?.data?.detail || '변경에 실패했습니다.', ok: false })
    } finally {
      setIsPwSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`,
    borderRadius: '12px', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', color: c.textPrimary, background: c.bgInput,
  }

  const cardStyle: React.CSSProperties = {
    background: c.bgCard, borderRadius: '20px', border: `1.5px solid ${c.border}`,
    padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', transition: 'background 0.2s ease',
  }

  if (!user) return null

  return (
    <>
    {showDeleteConfirm && (
      <ConfirmModal
        message="정말 탈퇴할까요?"
        subMessage="모든 페르소나와 대화 기록이 삭제되며 되돌릴 수 없어요."
        confirmLabel="탈퇴하기"
        danger
        onConfirm={async () => { await api.delete('/auth/me'); showToast('탈퇴가 완료됐어요. 이용해주셔서 감사해요.', 'info'); logout() }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem', transition: 'background 0.2s ease' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div>
          <h1 style={{ fontSize: isMobile ? '1.125rem' : '1.375rem', fontWeight: 700, color: c.textPrimary, margin: 0 }}>마이페이지</h1>
          <p style={{ color: c.textMuted, fontSize: '0.875rem', marginTop: '0.25rem' }}>계정 정보를 확인하고 수정할 수 있어요</p>
        </div>

        {/* 계정 정보 */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: c.textPrimary, margin: '0 0 1.25rem 0' }}>계정 정보</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: c.bgSofter, borderRadius: '12px' }}>
              <span style={{ fontSize: '0.875rem', color: c.textSecondary }}>이메일</span>
              <span style={{ fontSize: '0.875rem', color: c.textPrimary, fontWeight: 500 }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: c.bgSofter, borderRadius: '12px' }}>
              <span style={{ fontSize: '0.875rem', color: c.textSecondary }}>닉네임</span>
              <span style={{ fontSize: '0.875rem', color: c.textPrimary, fontWeight: 500 }}>{user.nickname}</span>
            </div>
          </div>
        </div>

        {/* 닉네임 변경 */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: c.textPrimary, margin: '0 0 1.25rem 0' }}>닉네임 변경</h2>
          <form onSubmit={handleNicknameSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}
              placeholder="새 닉네임" style={inputStyle} required
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = c.borderStrong}
            />
            {nicknameMsg && (
              <p style={{ fontSize: '0.875rem', color: nicknameMsg.ok ? '#16a34a' : '#dc2626', margin: 0 }}>
                {nicknameMsg.text}
              </p>
            )}
            <button type="submit" disabled={isNicknameSaving}
              style={{ background: isNicknameSaving ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 600, padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: isNicknameSaving ? 'not-allowed' : 'pointer', fontSize: '0.9375rem' }}
            >
              {isNicknameSaving ? '저장 중...' : '변경하기'}
            </button>
          </form>
        </div>

        {/* 비밀번호 변경 */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: c.textPrimary, margin: '0 0 1.25rem 0' }}>비밀번호 변경</h2>
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })}
              placeholder="현재 비밀번호" style={inputStyle} required
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = c.borderStrong}
            />
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })}
              placeholder="새 비밀번호 (8자 이상)" style={inputStyle} required
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = c.borderStrong}
            />
            <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              placeholder="새 비밀번호 확인" style={inputStyle} required
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = c.borderStrong}
            />
            {pwMsg && (
              <p style={{ fontSize: '0.875rem', color: pwMsg.ok ? '#16a34a' : '#dc2626', margin: 0 }}>
                {pwMsg.text}
              </p>
            )}
            <button type="submit" disabled={isPwSaving}
              style={{ background: isPwSaving ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 600, padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: isPwSaving ? 'not-allowed' : 'pointer', fontSize: '0.9375rem' }}
            >
              {isPwSaving ? '변경 중...' : '변경하기'}
            </button>
          </form>
        </div>

        {/* 로그아웃 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, color: c.textPrimary, fontSize: '0.9375rem', margin: 0 }}>로그아웃</p>
              <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>다른 계정으로 로그인하려면 로그아웃하세요</p>
            </div>
            <button
              onClick={() => { showToast('로그아웃됐어요', 'info'); logout() }}
              style={{ fontSize: '0.875rem', color: c.textSecondary, padding: '0.5rem 1rem', border: `1.5px solid ${c.borderStrong}`, borderRadius: '10px', background: c.bgCard, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 회원탈퇴 */}
        <div style={{ ...cardStyle, border: '1.5px solid #fee2e2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9375rem', margin: 0 }}>회원탈퇴</p>
              <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>탈퇴하면 모든 페르소나와 대화 기록이 삭제돼요</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ fontSize: '0.875rem', color: '#dc2626', padding: '0.5rem 1rem', border: '1.5px solid #fecaca', borderRadius: '10px', background: c.bgCard, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              탈퇴하기
            </button>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}
