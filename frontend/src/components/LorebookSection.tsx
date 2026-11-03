import { useEffect, useState } from 'react'
import api from '../api/client'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'

type LoreEntry = { id: number; title: string; keywords: string | null; content: string; always_on: boolean }
type Draft = { title: string; keywords: string; content: string; always_on: boolean }

const EMPTY: Draft = { title: '', keywords: '', content: '', always_on: false }

/**
 * 캐릭터 설정집 — 세계관 · 주변 인물 · 과거 사건을 항목별로 저장해 두면
 * 대화에 관련된 항목만 골라 AI에게 넘긴다 (백엔드 services/lorebook.py).
 * 미리보기: 메시지를 넣어 보면 어떤 항목이 들어가는지 AI 호출 없이 확인할 수 있다.
 */
export default function LorebookSection({ personaId }: { personaId: string }) {
  const c = useThemeColors()
  const { showToast } = useToast()
  const [entries, setEntries] = useState<LoreEntry[]>([])
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState('')
  const [previewResult, setPreviewResult] = useState<LoreEntry[] | null>(null)

  const load = () => api.get(`/personas/${personaId}/lore`).then((r) => setEntries(r.data)).catch(() => {})
  useEffect(() => { load() }, [personaId]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!draft.title.trim() || !draft.content.trim()) return showToast('제목과 내용을 입력해주세요', 'error')
    setSaving(true)
    try {
      const body = { ...draft, keywords: draft.keywords.trim() || null }
      if (editingId) await api.put(`/personas/${personaId}/lore/${editingId}`, body)
      else await api.post(`/personas/${personaId}/lore`, body)
      setDraft(EMPTY)
      setEditingId(null)
      setPreviewResult(null)
      await load()
      showToast(editingId ? '설정을 수정했어요' : '설정을 추가했어요', 'success')
    } catch (e: any) {
      showToast(e.response?.data?.detail ?? '저장하지 못했어요', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await api.delete(`/personas/${personaId}/lore/${id}`)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      if (editingId === id) { setEditingId(null); setDraft(EMPTY) }
    } catch {
      showToast('삭제하지 못했어요', 'error')
    }
  }

  const runPreview = async () => {
    if (!preview.trim()) return
    const r = await api.post(`/personas/${personaId}/lore/preview`, { message: preview })
    setPreviewResult(r.data.selected)
  }

  const input = { width: '100%', padding: '0.625rem 0.75rem', borderRadius: '10px', border: `1.5px solid ${c.border}`, background: c.bgCard, color: c.textPrimary, fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' as const }
  const label = { fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.375rem', display: 'block' }

  return (
    <div style={{ background: c.bgCard, borderRadius: '20px', border: `1.5px solid ${c.border}`, padding: '2rem', marginTop: '1.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: c.textPrimary, margin: 0 }}>설정집 <span style={{ color: c.textMuted, fontWeight: 500, fontSize: '0.875rem' }}>{entries.length}/50</span></h2>
      <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: '0.375rem 0 1.25rem', lineHeight: 1.6 }}>
        세계관 · 주변 인물 · 과거 사건을 항목별로 적어두면 대화에 관련된 설정만 골라서 AI에게 전달해요.
        설정이 많아도 대화가 느려지거나 캐릭터가 헷갈리지 않아요.
      </p>

      {entries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {entries.map((e) => (
            <div key={e.id} style={{ border: `1.5px solid ${editingId === e.id ? '#8b5cf6' : c.border}`, borderRadius: '12px', padding: '0.75rem 0.875rem', background: c.bgSoft }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: c.textPrimary, fontSize: '0.875rem', flex: 1 }}>
                  {e.title}
                  {e.always_on && <span style={{ marginLeft: 6, fontSize: '0.6875rem', color: '#8b5cf6', fontWeight: 700 }}>항상</span>}
                </strong>
                <button type="button" onClick={() => { setEditingId(e.id); setDraft({ title: e.title, keywords: e.keywords ?? '', content: e.content, always_on: e.always_on }) }}
                  style={{ fontSize: '0.75rem', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>수정</button>
                <button type="button" onClick={() => remove(e.id)}
                  style={{ fontSize: '0.75rem', color: c.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
              </div>
              {e.keywords && <p style={{ fontSize: '0.75rem', color: '#8b5cf6', margin: '0.25rem 0 0' }}>키워드: {e.keywords}</p>}
              <p style={{ fontSize: '0.8125rem', color: c.textSecondary, margin: '0.25rem 0 0', whiteSpace: 'pre-wrap', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.content}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: `1px solid ${c.border}`, paddingTop: '1.25rem' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: c.textPrimary }}>{editingId ? '설정 수정' : '새 설정 추가'}</p>
        <div>
          <label style={label}>제목</label>
          <input style={input} maxLength={100} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="예: 여동생 하린" />
        </div>
        <div>
          <label style={label}>키워드 <span style={{ fontWeight: 400, color: c.textMuted }}>(쉼표로 구분 · 대화에 나오면 반드시 포함)</span></label>
          <input style={input} maxLength={300} value={draft.keywords} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} placeholder="예: 하린, 동생, 여동생" />
        </div>
        <div>
          <label style={label}>내용 <span style={{ fontWeight: 400, color: c.textMuted }}>{draft.content.length}/2000</span></label>
          <textarea style={{ ...input, minHeight: '96px', resize: 'vertical' }} maxLength={2000} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            placeholder="예: 3살 어린 여동생. 미대 입시 중이고 오빠한테만 툭툭거리지만 사실 제일 의지한다." />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: c.textSecondary, cursor: 'pointer' }}>
          <input type="checkbox" checked={draft.always_on} onChange={(e) => setDraft({ ...draft, always_on: e.target.checked })} />
          항상 포함 (모든 대화에 필요한 핵심 세계관일 때만)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setDraft(EMPTY) }}
              style={{ flex: 1, border: `1.5px solid ${c.borderStrong}`, color: c.textLabel, fontWeight: 600, padding: '0.625rem', borderRadius: '10px', background: c.bgCard, cursor: 'pointer' }}>취소</button>
          )}
          <button type="button" onClick={save} disabled={saving}
            style={{ flex: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, padding: '0.625rem', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : editingId ? '수정 저장' : '설정 추가'}
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: '1.25rem', borderTop: `1px solid ${c.border}`, paddingTop: '1.25rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.875rem', color: c.textPrimary }}>미리보기</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input style={input} value={preview} onChange={(e) => setPreview(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runPreview() } }}
              placeholder="사용자가 보낼 메시지를 넣어보세요 (예: 요즘 동생이랑 잘 지내?)" />
            <button type="button" onClick={runPreview}
              style={{ flexShrink: 0, padding: '0 1rem', borderRadius: '10px', border: 'none', background: c.bgSoft, color: c.textPrimary, fontWeight: 600, cursor: 'pointer' }}>확인</button>
          </div>
          {previewResult && (
            <p style={{ fontSize: '0.8125rem', color: c.textSecondary, margin: '0.625rem 0 0' }}>
              {previewResult.length
                ? <>AI에게 함께 전달될 설정: {previewResult.map((e) => <b key={e.id} style={{ color: '#8b5cf6', marginRight: 6 }}>{e.title}</b>)}</>
                : '이 메시지에는 함께 전달되는 설정이 없어요'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
