import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useIsMobile } from '../hooks/useIsMobile'
import { useToast } from '../context/ToastContext'
import PersonaAvatar from '../components/PersonaAvatar'

interface Persona {
  id: number
  name: string
  personality: string
  speech_style: string | null
  is_public: boolean
  chat_count: number
  avatar_url: string | null
}

export default function MyPersonasPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { showToast } = useToast()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/personas/me')
      .then((res) => setPersonas(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 페르소나를 삭제할까요? 대화 기록도 함께 삭제됩니다.`)) return
    await api.delete(`/personas/${id}`)
    setPersonas(personas.filter((p) => p.id !== id))
    showToast(`"${name}" 페르소나가 삭제됐어요.`, 'success')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#f8f9fc', padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.125rem' : '1.375rem', fontWeight: 700, color: '#111827', margin: 0 }}>내 페르소나</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>내가 만든 AI 캐릭터 목록</p>
          </div>
          <button
            onClick={() => navigate('/create')}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '10px', padding: isMobile ? '0.5rem 0.875rem' : '0.5625rem 1.125rem', fontSize: isMobile ? '0.8125rem' : '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + 새로 만들기
          </button>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '1.25rem', border: '1px solid #f0f0f0', height: '72px' }} />
            ))}
          </div>
        )}

        {!isLoading && personas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ width: '60px', height: '60px', background: '#f3f4f6', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.5rem', color: '#d1d5db' }}>+</span>
            </div>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>아직 만든 페르소나가 없어요</p>
            <button
              onClick={() => navigate('/create')}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', padding: '0.75rem 2rem', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
            >
              첫 번째 만들기
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {personas.map((persona) => (
            <PersonaRow
              key={persona.id}
              persona={persona}
              isMobile={isMobile}
              onChat={() => navigate(`/chat/${persona.id}`)}
              onEdit={() => navigate(`/edit/${persona.id}`)}
              onDelete={() => handleDelete(persona.id, persona.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PersonaRow({ persona, isMobile, onChat, onEdit, onDelete }: {
  persona: Persona
  isMobile: boolean
  onChat: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'white', borderRadius: '14px', padding: '1rem 1.25rem', border: hovered ? '1.5px solid #c7d2fe' : '1.5px solid #f0f0f0', boxShadow: hovered ? '0 4px 12px rgba(99,102,241,0.07)' : 'none', transition: 'all 0.18s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
          <PersonaAvatar name={persona.name} avatarUrl={persona.avatar_url} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>{persona.name}</span>
              <span style={{ fontSize: '0.6875rem', padding: '0.1rem 0.5rem', borderRadius: '999px', background: persona.is_public ? '#f0fdf4' : '#f9fafb', color: persona.is_public ? '#16a34a' : '#9ca3af', fontWeight: 600 }}>
                {persona.is_public ? '공개' : '비공개'}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '160px' : '320px' }}>
              {persona.personality}
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0, marginLeft: '0.75rem' }}>
          {!isMobile && (
            <span style={{ fontSize: '0.75rem', color: '#d1d5db', marginRight: '0.25rem' }}>대화 {persona.chat_count}회</span>
          )}
          <button
            onClick={onChat}
            style={{ fontSize: '0.8125rem', color: '#6366f1', fontWeight: 600, padding: '0.375rem 0.625rem', border: '1.5px solid #c7d2fe', borderRadius: '8px', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            대화
          </button>
          <button
            onClick={onEdit}
            style={{ fontSize: '0.8125rem', color: '#6b7280', padding: '0.375rem 0.625rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            수정
          </button>
          <button
            onClick={onDelete}
            style={{ fontSize: '0.8125rem', color: '#fca5a5', padding: '0.375rem 0.625rem', border: '1.5px solid #fecaca', borderRadius: '8px', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
