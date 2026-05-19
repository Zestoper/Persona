import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

const STYLES = [
  { id: 'lorelei',   label: '일러스트' },
  { id: 'avataaars', label: '카툰' },
  { id: 'notionists',label: '미니멀' },
  { id: 'big-smile', label: '귀여운' },
  { id: 'personas',  label: '실사풍' },
  { id: 'bottts',    label: '로봇' },
  { id: 'pixel-art', label: '픽셀아트' },
]

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

export default function EditPersonaPage() {
  const { personaId } = useParams<{ personaId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', personality: '', background: '', speech_style: '', is_public: false,
  })
  const [style, setStyle] = useState('lorelei')
  const [seed, setSeed] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get(`/personas/${personaId}`)
      .then((res) => {
        const p = res.data
        setForm({
          name: p.name,
          personality: p.personality,
          background: p.background ?? '',
          speech_style: p.speech_style ?? '',
          is_public: p.is_public,
        })
        setCurrentAvatarUrl(p.avatar_url)
        setSeed(p.name)
      })
      .finally(() => setIsFetching(false))
  }, [personaId])

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
    setSeed(`${form.name || 'persona'}-${Math.random().toString(36).slice(2, 7)}`)
  }

  const displayAvatar = avatarPreview
    ?? (avatarFile ? null : (seed ? dicebearUrl(style, seed) : currentAvatarUrl))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const avatarUrl = avatarFile ? null : (seed ? dicebearUrl(style, seed) : currentAvatarUrl)
      await api.put(`/personas/${personaId}`, { ...form, avatar_url: avatarUrl })

      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        await api.post(`/personas/${personaId}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/my')
    } catch (err: any) {
      setError(err.response?.data?.detail || '수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb',
    borderRadius: '12px', fontSize: '0.9375rem', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', background: 'white',
  }

  if (isFetching) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af' }}>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#f8f9fc', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '580px', margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#111827', margin: 0 }}>페르소나 수정</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.375rem' }}>캐릭터 정보를 수정하면 AI 설정이 자동으로 재생성돼요</p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #f0f0f0', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* 아바타 */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '88px', height: '88px', borderRadius: '18px', border: '2px dashed #c7d2fe', overflow: 'hidden', cursor: 'pointer', background: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#c7d2fe', fontSize: '1.5rem' }}>+</span>
                  )}
                </div>
                <p style={{ fontSize: '0.6875rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.375rem' }}>
                  클릭해서 교체
                </p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                  스타일
                  {avatarFile && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: '0.375rem' }}>(업로드 이미지 사용 중)</span>}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  {STYLES.map((s) => (
                    <button
                      key={s.id} type="button"
                      onClick={() => { setStyle(s.id); setAvatarFile(null); setAvatarPreview(null) }}
                      style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', background: style === s.id && !avatarFile ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f3f4f6', color: style === s.id && !avatarFile ? 'white' : '#6b7280' }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button" onClick={regenerate}
                    style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, background: '#eef2ff', border: 'none', borderRadius: '8px', padding: '0.375rem 0.75rem', cursor: 'pointer' }}
                  >
                    다시 생성
                  </button>
                  <button
                    type="button" onClick={() => fileInputRef.current?.click()}
                    style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '0.375rem 0.75rem', cursor: 'pointer' }}
                  >
                    직접 업로드
                  </button>
                  {avatarFile && (
                    <button
                      type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null) }}
                      style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      제거
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 이름 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                캐릭터 이름 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* 성격 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                성격 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea name="personality" value={form.personality} onChange={handleChange} required rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* 배경스토리 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                배경스토리 <span style={{ color: '#d1d5db', fontWeight: 400 }}>선택</span>
              </label>
              <textarea name="background" value={form.background} onChange={handleChange} rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* 말투 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                말투 <span style={{ color: '#d1d5db', fontWeight: 400 }}>선택</span>
              </label>
              <input type="text" name="speech_style" value={form.speech_style} onChange={handleChange} style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* 공개 여부 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: '#f8f9fc', borderRadius: '12px' }}>
              <input type="checkbox" id="is_public" name="is_public" checked={form.is_public} onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
              />
              <label htmlFor="is_public" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer', userSelect: 'none' }}>
                마켓플레이스에 공개
                <span style={{ color: '#9ca3af', marginLeft: '0.375rem', fontSize: '0.8125rem' }}>— 다른 사람도 대화 가능</span>
              </label>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => navigate('/my')}
                style={{ flex: 1, border: '1.5px solid #e5e7eb', color: '#374151', fontWeight: 600, padding: '0.75rem', borderRadius: '12px', background: 'white', cursor: 'pointer', fontSize: '0.9375rem' }}
              >
                취소
              </button>
              <button type="submit" disabled={isLoading}
                style={{ flex: 1, background: isLoading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '0.9375rem', boxShadow: isLoading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)' }}
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
