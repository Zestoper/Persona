import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../context/ToastContext'

const STYLES = [
  { id: 'lorelei',    label: '일러스트' },
  { id: 'avataaars', label: '카툰' },
  { id: 'notionists', label: '미니멀' },
  { id: 'big-smile', label: '귀여운' },
  { id: 'personas',  label: '실사풍' },
  { id: 'bottts',    label: '로봇' },
  { id: 'pixel-art', label: '픽셀아트' },
]

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

export default function CreatePersonaPage() {
  const navigate = useNavigate()
  const c = useThemeColors()
  const { showToast } = useToast()

  const [form, setForm] = useState({
    name: '', personality: '', background: '', speech_style: '', is_public: false,
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [style, setStyle] = useState('lorelei')
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 7))
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const regenerate = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setSeed(Math.random().toString(36).slice(2, 7))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,/g, '')
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag])
      }
      setTagInput('')
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

  const handleAiGenerate = async () => {
    if (!form.name.trim()) { setError('이름을 먼저 입력해주세요.'); return }
    setError('')
    setIsGenerating(true)
    try {
      const res = await api.post('/personas/generate', {
        name: form.name,
        hint: form.background || null,
      })
      setForm((prev) => ({
        ...prev,
        personality: res.data.personality,
        background: res.data.background,
        speech_style: res.data.speech_style,
      }))
    } catch {
      setError('AI 생성에 실패했어요. 다시 시도해보세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  const displayAvatar = avatarPreview ?? (form.name ? dicebearUrl(style, `${form.name}-${seed}`) : null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const avatarUrl = avatarFile ? null : (form.name ? dicebearUrl(style, `${form.name}-${seed}`) : null)
      const tagsStr = tags.join(',') || null
      const res = await api.post('/personas', { ...form, avatar_url: avatarUrl, tags: tagsStr })
      const personaId = res.data.id

      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        await api.post(`/personas/${personaId}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      const autoCollections: string[] = res.data.auto_collections || []
      if (autoCollections.length > 0) {
        showToast(`✨ '${autoCollections.join(', ')}' 컬렉션에 자동으로 추가됐어요!`, 'success')
      }

      navigate(`/chat/${personaId}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: `1.5px solid ${c.borderStrong}`,
    borderRadius: '12px', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', color: c.textPrimary, background: c.bgInput,
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: c.bgPage, padding: '2rem 1.5rem', transition: 'background 0.2s ease' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: c.textPrimary, margin: 0 }}>페르소나 만들기</h1>
          <p style={{ color: c.textMuted, fontSize: '0.875rem', marginTop: '0.375rem' }}>캐릭터 정보를 입력하면 AI 설정이 자동으로 생성돼요</p>
        </div>

        <div style={{ background: c.bgCard, borderRadius: '20px', border: `1.5px solid ${c.border}`, padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', transition: 'background 0.2s ease' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '88px', height: '88px', borderRadius: '18px', border: `2px dashed ${c.borderHover}`, overflow: 'hidden', cursor: 'pointer', background: c.isDark ? '#1e2d4a' : '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: c.borderHover, fontSize: '1.5rem' }}>+</span>
                  )}
                </div>
                <p style={{ fontSize: '0.6875rem', color: c.textMuted, textAlign: 'center', marginTop: '0.375rem' }}>클릭해서 교체</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: c.textLabel, marginBottom: '0.5rem' }}>
                  스타일
                  {avatarFile && <span style={{ color: c.textMuted, fontWeight: 400, marginLeft: '0.375rem' }}>(업로드 이미지 사용 중)</span>}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {STYLES.map((s) => (
                    <button key={s.id} type="button" onClick={() => { setStyle(s.id); setAvatarFile(null); setAvatarPreview(null) }}
                      style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: style === s.id && !avatarFile ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : c.bgSoft, color: style === s.id && !avatarFile ? 'white' : c.textSecondary }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={regenerate}
                    style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, background: c.isDark ? '#312e81' : '#eef2ff', border: 'none', borderRadius: '8px', padding: '0.375rem 0.75rem', cursor: 'pointer' }}
                  >
                    다시 생성
                  </button>
                  {avatarFile && (
                    <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      style={{ fontSize: '0.75rem', color: c.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      업로드 제거
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={labelStyle}>캐릭터 이름 <span style={{ color: '#ef4444' }}>*</span></label>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  style={{
                    fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '8px', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                    background: isGenerating ? c.bgSoft : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: isGenerating ? c.textMuted : 'white',
                  }}
                >
                  {isGenerating ? 'AI 생성 중...' : 'AI로 채우기'}
                </button>
              </div>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                placeholder="예: 민준" required style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
              <p style={{ fontSize: '0.75rem', color: c.textMuted, marginTop: '0.375rem' }}>
                이름 입력 후 "AI로 채우기"를 누르면 성격/배경/말투가 자동 생성돼요
              </p>
            </div>

            <div>
              <label style={labelStyle}>성격 <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                name="personality" value={form.personality} onChange={handleChange}
                placeholder="예: 밝고 에너지 넘치는 20대. 항상 긍정적이고 친구들을 잘 챙김."
                required rows={3} style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

            <div>
              <label style={labelStyle}>배경스토리 <span style={{ color: c.textMuted, fontWeight: 400 }}>선택</span></label>
              <textarea
                name="background" value={form.background} onChange={handleChange}
                placeholder="예: 서울 출신의 대학생. 커피를 좋아하고 음악을 즐겨 들음."
                rows={3} style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

            <div>
              <label style={labelStyle}>말투 <span style={{ color: c.textMuted, fontWeight: 400 }}>선택</span></label>
              <input
                type="text" name="speech_style" value={form.speech_style} onChange={handleChange}
                placeholder="예: 친근한 반말, 짧고 간결하게" style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = c.borderStrong}
              />
            </div>

            <div>
              <label style={labelStyle}>태그 <span style={{ color: c.textMuted, fontWeight: 400 }}>선택 (최대 5개)</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', padding: '0.625rem 0.875rem', border: `1.5px solid ${c.borderStrong}`, borderRadius: '12px', background: c.bgInput, minHeight: '46px', alignItems: 'center' }}>
                {tags.map((tag) => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', background: c.isDark ? '#312e81' : '#eef2ff', color: '#6366f1', padding: '0.2rem 0.625rem', borderRadius: '999px', fontWeight: 600 }}>
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 0, lineHeight: 1, fontSize: '0.875rem' }}>×</button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    type="text" value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? '태그 입력 후 Enter (예: 친구, 힐링)' : ''}
                    style={{ border: 'none', outline: 'none', fontSize: '0.875rem', flex: 1, minWidth: '120px', background: 'transparent', color: c.textPrimary }}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: c.bgSofter, borderRadius: '12px' }}>
              <input
                type="checkbox" id="is_public" name="is_public"
                checked={form.is_public} onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label htmlFor="is_public" style={{ fontSize: '0.875rem', color: c.textLabel, cursor: 'pointer', userSelect: 'none' }}>
                마켓플레이스에 공개
                <span style={{ color: c.textMuted, marginLeft: '0.375rem', fontSize: '0.8125rem' }}>— 다른 사람도 대화 가능</span>
              </label>
            </div>

            {error && (
              <div style={{ background: c.isDark ? '#450a0a' : '#fef2f2', border: `1px solid ${c.isDark ? '#7f1d1d' : '#fecaca'}`, color: c.isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => navigate(-1)}
                style={{ flex: 1, border: `1.5px solid ${c.borderStrong}`, color: c.textLabel, fontWeight: 600, padding: '0.75rem', borderRadius: '12px', background: c.bgCard, cursor: 'pointer', fontSize: '0.9375rem' }}
              >
                취소
              </button>
              <button type="submit" disabled={isLoading}
                style={{ flex: 1, background: isLoading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.9375rem', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)' }}
              >
                {isLoading ? '생성 중...' : '만들기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
