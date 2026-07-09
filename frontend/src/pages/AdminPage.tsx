import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../context/ToastContext'
import { SkeletonRow } from '../components/Skeleton'
import ConfirmModal from '../components/ConfirmModal'

interface Stats {
  total_users: number
  total_personas: number
  total_conversations: number
  total_messages: number
  total_reports: number
  pending_reports: number
}

interface AdminUser {
  id: number
  email: string
  nickname: string
  is_active: boolean
  is_admin: boolean
  persona_count: number
  created_at: string
}

interface AdminPersona {
  id: number
  name: string
  user_id: number
  user_nickname: string
  is_public: boolean
  chat_count: number
  tags: string | null
  created_at: string
}

interface AdminReport {
  id: number
  persona_id: number
  persona_name: string
  reporter_id: number
  reporter_nickname: string
  reason: string
  description: string | null
  status: string
  created_at: string
}

interface Collection {
  id: number
  title: string
  description: string | null
  emoji: string | null
  is_featured: boolean
  persona_count: number
  created_at: string
}

interface CollectionPersona {
  id: number
  name: string
  is_public: boolean
  chat_count: number
  tags: string | null
  creator_nickname: string | null
}

type Tab = 'stats' | 'reports' | 'users' | 'personas' | 'collections'

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: '검토 대기', color: '#d97706', bg: '#fef3c7' },
  resolved: { label: '처리 완료', color: '#059669', bg: '#d1fae5' },
  rejected: { label: '기각',     color: '#6b7280', bg: '#f3f4f6' },
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const c = useThemeColors()
  const isMobile = useIsMobile()
  const { showToast } = useToast()

  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [personas, setPersonas] = useState<AdminPersona[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [reportFilter, setReportFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [personaSearch, setPersonaSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; subMessage: string; onConfirm: () => void } | null>(null)

  const [newCollection, setNewCollection] = useState({ title: '', description: '', emoji: '📚' })
  const [expandedColId, setExpandedColId] = useState<number | null>(null)
  const [colPersonas, setColPersonas] = useState<CollectionPersona[]>([])
  const [addSearch, setAddSearch] = useState('')
  const [colLoading, setColLoading] = useState(false)

  useEffect(() => {
    if (user && !user.is_admin) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    if (!user?.is_admin) return
    if (tab === 'stats') loadStats()
    if (tab === 'users') loadUsers()
    if (tab === 'personas') loadPersonas()
    if (tab === 'reports') loadReports(reportFilter)
    if (tab === 'collections') { loadCollections(); if (personas.length === 0) loadPersonas() }
  }, [tab, user])

  useEffect(() => {
    if (tab === 'reports') loadReports(reportFilter)
  }, [reportFilter])

  const loadStats = async () => {
    setIsLoading(true)
    try { setStats((await api.get('/admin/stats')).data) } finally { setIsLoading(false) }
  }

  const loadUsers = async () => {
    setIsLoading(true)
    try { setUsers((await api.get('/admin/users')).data) } finally { setIsLoading(false) }
  }

  const loadPersonas = async () => {
    setIsLoading(true)
    try { setPersonas((await api.get('/admin/personas')).data) } finally { setIsLoading(false) }
  }

  const loadReports = async (statusFilter: string) => {
    setIsLoading(true)
    try { setReports((await api.get('/admin/reports', { params: statusFilter ? { status_filter: statusFilter } : {} })).data) }
    finally { setIsLoading(false) }
  }

  const loadCollections = async () => {
    setIsLoading(true)
    try { setCollections((await api.get('/collections')).data) } finally { setIsLoading(false) }
  }

  const handleCreateCollection = async () => {
    if (!newCollection.title.trim()) { showToast('제목을 입력해주세요', 'error'); return }
    try {
      const res = await api.post('/collections', newCollection)
      setCollections((prev) => [res.data, ...prev])
      setNewCollection({ title: '', description: '', emoji: '📚' })
      showToast('컬렉션이 생성됐어요', 'success')
    } catch { showToast('생성에 실패했어요', 'error') }
  }

  const handleDeleteCollection = (colId: number, title: string) => {
    setConfirmState({
      message: `"${title}" 컬렉션을 삭제할까요?`,
      subMessage: '컬렉션에 연결된 페르소나 관계도 모두 삭제됩니다.',
      onConfirm: async () => {
        try {
          await api.delete(`/collections/${colId}`)
          setCollections((prev) => prev.filter((c) => c.id !== colId))
          if (expandedColId === colId) setExpandedColId(null)
          showToast('삭제됐어요', 'success')
        } catch { showToast('삭제에 실패했어요', 'error') }
        setConfirmState(null)
      },
    })
  }

  const handleExpandCollection = async (colId: number) => {
    if (expandedColId === colId) { setExpandedColId(null); return }
    setExpandedColId(colId)
    setColLoading(true)
    try {
      const res = await api.get(`/collections/${colId}`)
      setColPersonas(res.data.personas)
    } finally { setColLoading(false) }
  }

  const handleAddPersona = async (colId: number, personaId: number) => {
    try {
      await api.post(`/collections/${colId}/personas/${personaId}`)
      const p = personas.find((p) => p.id === personaId)
      if (p) setColPersonas((prev) => [{ id: p.id, name: p.name, is_public: p.is_public, chat_count: p.chat_count, tags: p.tags, creator_nickname: p.user_nickname }, ...prev])
      setCollections((prev) => prev.map((c) => c.id === colId ? { ...c, persona_count: c.persona_count + 1 } : c))
      showToast('추가됐어요', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.detail || '추가에 실패했어요', 'error')
    }
  }

  const handleRemovePersona = async (colId: number, personaId: number) => {
    try {
      await api.delete(`/collections/${colId}/personas/${personaId}`)
      setColPersonas((prev) => prev.filter((p) => p.id !== personaId))
      setCollections((prev) => prev.map((c) => c.id === colId ? { ...c, persona_count: Math.max(0, c.persona_count - 1) } : c))
      showToast('제거됐어요', 'info')
    } catch { showToast('제거에 실패했어요', 'error') }
  }

  const handleToggleUser = async (userId: number) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-active`)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      showToast(res.data.is_active ? '계정이 활성화됐어요' : '계정이 비활성화됐어요', 'success')
    } catch { showToast('처리에 실패했어요', 'error') }
  }

  const handleDeleteUser = (userId: number, nickname: string) => {
    setConfirmState({
      message: `"${nickname}" 계정을 삭제할까요?`,
      subMessage: '해당 유저의 페르소나와 대화 기록도 모두 삭제됩니다.',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`)
          setUsers((prev) => prev.filter((u) => u.id !== userId))
          showToast('계정이 삭제됐어요', 'success')
        } catch { showToast('삭제에 실패했어요', 'error') }
        setConfirmState(null)
      },
    })
  }

  const handleTogglePublic = async (personaId: number) => {
    try {
      const res = await api.put(`/admin/personas/${personaId}/toggle-public`)
      setPersonas((prev) => prev.map((p) => p.id === personaId ? { ...p, is_public: res.data.is_public } : p))
      showToast(res.data.is_public ? '공개로 전환됐어요' : '비공개로 전환됐어요', 'success')
    } catch { showToast('처리에 실패했어요', 'error') }
  }

  const handleDeletePersona = (personaId: number, name: string) => {
    setConfirmState({
      message: `"${name}" 페르소나를 강제 삭제할까요?`,
      subMessage: '관련 대화도 모두 삭제됩니다.',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/personas/${personaId}`)
          setPersonas((prev) => prev.filter((p) => p.id !== personaId))
          showToast('삭제됐어요', 'success')
        } catch { showToast('삭제에 실패했어요', 'error') }
        setConfirmState(null)
      },
    })
  }

  const handleUpdateReport = async (reportId: number, newStatus: 'resolved' | 'rejected') => {
    try {
      const res = await api.put(`/admin/reports/${reportId}`, { status: newStatus })
      setReports((prev) => prev.map((r) => r.id === reportId ? res.data : r))
      showToast(newStatus === 'resolved' ? '신고가 처리됐어요' : '신고가 기각됐어요', 'success')
    } catch { showToast('처리에 실패했어요', 'error') }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'stats',       label: '통계' },
    { key: 'reports',     label: `신고${stats ? ` (${stats.pending_reports})` : ''}` },
    { key: 'users',       label: '유저' },
    { key: 'personas',    label: '페르소나' },
    { key: 'collections', label: '컬렉션' },
  ]

  if (!user?.is_admin) return null

  return (
    <>
    {confirmState && (
      <ConfirmModal
        message={confirmState.message}
        subMessage={confirmState.subMessage}
        confirmLabel="삭제"
        danger
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(null)}
      />
    )}
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: isMobile ? '1.75rem 1rem' : '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Admin</p>
          <h1 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.625rem', fontWeight: 700, margin: 0 }}>관리자 페이지</h1>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem' }}>

        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600,
                background: tab === t.key ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : c.bgCard,
                color: tab === t.key ? 'white' : c.textSecondary,
                boxShadow: tab === t.key ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} c={c} />)}
          </div>
        )}

        {!isLoading && tab === 'stats' && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: '전체 유저',      value: stats.total_users,         icon: '👤' },
              { label: '전체 페르소나',  value: stats.total_personas,      icon: '🤖' },
              { label: '전체 대화방',    value: stats.total_conversations, icon: '💬' },
              { label: '전체 메시지',    value: stats.total_messages,      icon: '📨' },
              { label: '전체 신고',      value: stats.total_reports,       icon: '🚨' },
              { label: '대기 신고',      value: stats.pending_reports,     icon: '⏳', highlight: stats.pending_reports > 0 },
            ].map((item) => (
              <div
                key={item.label}
                style={{ background: c.bgCard, borderRadius: '16px', padding: '1.5rem', border: item.highlight ? '1.5px solid #f59e0b' : `1px solid ${c.border}` }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: item.highlight ? '#d97706' : c.textPrimary, marginBottom: '0.25rem' }}>
                  {item.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: c.textSecondary }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && tab === 'reports' && (
          <>
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[{ v: '', l: '전체' }, { v: 'pending', l: '대기 중' }, { v: 'resolved', l: '처리됨' }, { v: 'rejected', l: '기각됨' }].map((f) => (
                <button
                  key={f.v}
                  onClick={() => setReportFilter(f.v)}
                  style={{
                    padding: '0.375rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                    background: reportFilter === f.v ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : c.bgSoft,
                    color: reportFilter === f.v ? 'white' : c.textSecondary,
                  }}
                >
                  {f.l}
                </button>
              ))}
            </div>

            {reports.length === 0
              ? <EmptyState icon="🚨" text="신고 내역이 없어요" c={c} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {reports.map((r) => {
                    const st = STATUS_LABEL[r.status] || STATUS_LABEL.pending
                    return (
                      <div key={r.id} style={{ background: c.bgCard, borderRadius: '16px', padding: '1.25rem', border: `1px solid ${c.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: c.textPrimary }}>{r.persona_name}</span>
                              <span style={{ background: st.bg, color: st.color, fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '999px' }}>{st.label}</span>
                              <span style={{ background: c.bgSoft, color: c.textMuted, fontSize: '0.6875rem', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>{r.reason}</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: c.textSecondary, margin: '0 0 0.25rem 0' }}>
                              신고자: {r.reporter_nickname}
                            </p>
                            {r.description && (
                              <p style={{ fontSize: '0.875rem', color: c.textSecondary, margin: 0 }}>{r.description}</p>
                            )}
                            <p style={{ fontSize: '0.75rem', color: c.textMuted, margin: '0.375rem 0 0 0' }}>
                              {new Date(r.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button onClick={() => navigate(`/persona/${r.persona_id}`)} style={actionBtn('#4f46e5', '#ede9fe')}>보기</button>
                            {r.status === 'pending' && (
                              <>
                                <button onClick={() => handleUpdateReport(r.id, 'resolved')} style={actionBtn('#059669', '#d1fae5')}>처리</button>
                                <button onClick={() => handleUpdateReport(r.id, 'rejected')} style={actionBtn('#6b7280', c.bgSoft)}>기각</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </>
        )}

        {!isLoading && tab === 'users' && (
          <>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="닉네임 또는 이메일 검색..."
              style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.9375rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
            />
            {users.filter((u) => {
              const q = userSearch.toLowerCase()
              return !q || u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
            }).length === 0
              ? <EmptyState icon="👤" text="유저가 없어요" c={c} />
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {users.filter((u) => {
                  const q = userSearch.toLowerCase()
                  return !q || u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                }).map((u) => (
                  <div key={u.id} style={{ background: c.bgCard, borderRadius: '16px', padding: '1rem 1.25rem', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: c.textPrimary }}>{u.nickname}</span>
                        {u.is_admin && <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '999px' }}>관리자</span>}
                        {!u.is_active && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '999px' }}>비활성</span>}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: c.textMuted, margin: 0 }}>{u.email} · 페르소나 {u.persona_count}개 · {new Date(u.created_at).toLocaleDateString('ko-KR')} 가입</p>
                    </div>
                    {!u.is_admin && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          style={actionBtn(u.is_active ? '#d97706' : '#059669', u.is_active ? '#fef3c7' : '#d1fae5')}
                        >
                          {u.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.nickname)}
                          style={actionBtn('#dc2626', '#fee2e2')}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && tab === 'personas' && (
          <>
            <input
              type="text"
              value={personaSearch}
              onChange={(e) => setPersonaSearch(e.target.value)}
              placeholder="페르소나 이름 또는 작성자 검색..."
              style={{ width: '100%', padding: '0.625rem 1rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.9375rem', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
            />
            {personas.filter((p) => {
              const q = personaSearch.toLowerCase()
              return !q || p.name.toLowerCase().includes(q) || p.user_nickname.toLowerCase().includes(q)
            }).length === 0
              ? <EmptyState icon="🤖" text="페르소나가 없어요" c={c} />
              : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {personas.filter((p) => {
                  const q = personaSearch.toLowerCase()
                  return !q || p.name.toLowerCase().includes(q) || p.user_nickname.toLowerCase().includes(q)
                }).map((p) => (
                  <div key={p.id} style={{ background: c.bgCard, borderRadius: '16px', padding: '1rem 1.25rem', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: c.textPrimary }}>{p.name}</span>
                        <span style={{ background: p.is_public ? '#d1fae5' : c.bgSoft, color: p.is_public ? '#059669' : c.textMuted, fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
                          {p.is_public ? '공개' : '비공개'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: c.textMuted, margin: 0 }}>
                        작성자: {p.user_nickname} · 대화 {p.chat_count.toLocaleString()}회
                        {p.tags ? ` · ${p.tags}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => navigate(`/persona/${p.id}`)}
                        style={actionBtn('#4f46e5', '#ede9fe')}
                      >
                        보기
                      </button>
                      <button
                        onClick={() => handleTogglePublic(p.id)}
                        style={actionBtn(p.is_public ? '#d97706' : '#059669', p.is_public ? '#fef3c7' : '#d1fae5')}
                      >
                        {p.is_public ? '비공개' : '공개'}
                      </button>
                      <button
                        onClick={() => handleDeletePersona(p.id, p.name)}
                        style={actionBtn('#dc2626', '#fee2e2')}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!isLoading && tab === 'collections' && (
          <>

            <div style={{ background: c.bgCard, borderRadius: '16px', padding: '1.25rem', border: `1px solid ${c.border}`, marginBottom: '1.25rem' }}>
              <p style={{ fontWeight: 700, color: c.textPrimary, margin: '0 0 1rem 0', fontSize: '0.9375rem' }}>새 컬렉션 만들기</p>
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <input
                  value={newCollection.emoji}
                  onChange={(e) => setNewCollection((p) => ({ ...p, emoji: e.target.value }))}
                  placeholder="이모지"
                  style={{ width: '72px', padding: '0.625rem 0.75rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '1.125rem', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }}
                />
                <input
                  value={newCollection.title}
                  onChange={(e) => setNewCollection((p) => ({ ...p, title: e.target.value }))}
                  placeholder="컬렉션 제목 (예: 치매 예방)"
                  style={{ flex: 1, minWidth: '160px', padding: '0.625rem 1rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <input
                  value={newCollection.description}
                  onChange={(e) => setNewCollection((p) => ({ ...p, description: e.target.value }))}
                  placeholder="설명 (선택)"
                  style={{ flex: 2, minWidth: '200px', padding: '0.625rem 1rem', borderRadius: '10px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={handleCreateCollection} style={{ padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 700, fontSize: '0.9375rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  + 만들기
                </button>
              </div>
            </div>

            {collections.length === 0
              ? <EmptyState icon="✨" text="컬렉션이 없어요" c={c} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {collections.map((col) => {
                    const isExpanded = expandedColId === col.id
                    const alreadyIds = new Set(colPersonas.map((p) => p.id))
                    const filteredToAdd = personas.filter((p) => {
                      if (alreadyIds.has(p.id)) return false
                      const q = addSearch.toLowerCase()
                      return !q || p.name.toLowerCase().includes(q) || p.user_nickname.toLowerCase().includes(q)
                    })

                    return (
                      <div key={col.id} style={{ background: c.bgCard, borderRadius: '16px', border: `1px solid ${isExpanded ? '#6366f1' : c.border}`, overflow: 'hidden', transition: 'border-color 0.15s' }}>

                        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '1.5rem' }}>{col.emoji || '📚'}</span>
                            <div>
                              <span style={{ fontWeight: 700, color: c.textPrimary }}>{col.title}</span>
                              {col.description && <p style={{ fontSize: '0.8125rem', color: c.textMuted, margin: '0.125rem 0 0 0' }}>{col.description}</p>}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: c.textMuted, whiteSpace: 'nowrap' }}>페르소나 {col.persona_count}개</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button onClick={() => handleExpandCollection(col.id)} style={actionBtn(isExpanded ? '#7c3aed' : '#4f46e5', isExpanded ? '#ede9fe' : '#eef2ff')}>
                              {isExpanded ? '닫기' : '페르소나 관리'}
                            </button>
                            <button onClick={() => handleDeleteCollection(col.id, col.title)} style={actionBtn('#dc2626', '#fee2e2')}>삭제</button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${c.border}`, padding: '1rem 1.25rem', background: c.bgSofter }}>
                            {colLoading ? (
                              <p style={{ color: c.textMuted, fontSize: '0.875rem', margin: 0 }}>불러오는 중...</p>
                            ) : (
                              <>

                                <p style={{ fontWeight: 600, color: c.textPrimary, margin: '0 0 0.625rem 0', fontSize: '0.875rem' }}>
                                  현재 포함된 페르소나 ({colPersonas.length})
                                </p>
                                {colPersonas.length === 0
                                  ? <p style={{ fontSize: '0.8125rem', color: c.textMuted, marginBottom: '1rem' }}>아직 없어요. 아래에서 추가하세요.</p>
                                  : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                      {colPersonas.map((p) => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: '999px', padding: '0.25rem 0.75rem 0.25rem 0.875rem', fontSize: '0.8125rem' }}>
                                          <span style={{ color: c.textPrimary, fontWeight: 500 }}>{p.name}</span>
                                          <button
                                            onClick={() => handleRemovePersona(col.id, p.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.875rem', padding: '0 0 0 0.125rem', lineHeight: 1 }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }

                                <p style={{ fontWeight: 600, color: c.textPrimary, margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>페르소나 추가</p>
                                <input
                                  value={addSearch}
                                  onChange={(e) => setAddSearch(e.target.value)}
                                  placeholder="이름으로 검색..."
                                  style={{ width: '100%', padding: '0.5rem 0.875rem', borderRadius: '8px', border: `1.5px solid ${c.borderStrong}`, background: c.bgInput, color: c.textPrimary, fontSize: '0.875rem', outline: 'none', marginBottom: '0.625rem', boxSizing: 'border-box' }}
                                />
                                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                  {filteredToAdd.length === 0
                                    ? <p style={{ fontSize: '0.8125rem', color: c.textMuted, margin: 0 }}>추가할 페르소나가 없어요</p>
                                    : filteredToAdd.slice(0, 20).map((p) => (
                                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.375rem 0.75rem', borderRadius: '8px', background: c.bgCard, border: `1px solid ${c.border}` }}>
                                        <div>
                                          <span style={{ fontWeight: 500, color: c.textPrimary, fontSize: '0.875rem' }}>{p.name}</span>
                                          <span style={{ color: c.textMuted, fontSize: '0.75rem', marginLeft: '0.5rem' }}>{p.user_nickname}</span>
                                        </div>
                                        <button onClick={() => handleAddPersona(col.id, p.id)} style={actionBtn('#059669', '#d1fae5')}>추가</button>
                                      </div>
                                    ))
                                  }
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }
          </>
        )}

      </div>
    </div>
    </>
  )
}

function actionBtn(color: string, bg: string): React.CSSProperties {
  return { padding: '0.375rem 0.875rem', borderRadius: '8px', border: 'none', background: bg, color, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', whiteSpace: 'nowrap' }
}

function EmptyState({ icon, text, c }: { icon: string; text: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: c.textMuted }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  )
}
