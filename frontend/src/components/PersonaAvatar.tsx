const colors = [
  ['#eef2ff', '#6366f1'],
  ['#fdf2f8', '#ec4899'],
  ['#f0fdf4', '#16a34a'],
  ['#fff7ed', '#ea580c'],
  ['#f0f9ff', '#0284c7'],
  ['#fafaf9', '#78716c'],
]

function getColor(name: string) {
  return colors[name.charCodeAt(0) % colors.length]
}

interface Props {
  name: string
  avatarUrl?: string | null
  size?: number
  radius?: string
}

export default function PersonaAvatar({ name, avatarUrl, size = 44, radius = '12px' }: Props) {
  const [bg, fg] = getColor(name)

  if (avatarUrl) {
    // DiceBear 같은 외부 URL은 그대로, /static/... 같은 내부 경로는 백엔드 주소 붙이기
    const src = avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:8000${avatarUrl}`
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${bg}, ${bg})`, border: `1.5px solid ${fg}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: fg, fontWeight: 700, fontSize: size * 0.4 }}>{name[0]}</span>
    </div>
  )
}
