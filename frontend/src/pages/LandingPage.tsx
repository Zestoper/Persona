import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeColors } from '../hooks/useThemeColors'
import { useIsMobile } from '../hooks/useIsMobile'

const FEATURES = [
  {
    icon: '🎭',
    title: '나만의 AI 캐릭터',
    desc: '이름, 성격, 말투, 배경스토리까지 직접 설정해서 세상에 하나뿐인 AI 친구를 만들어보세요.',
  },
  {
    icon: '⚡',
    title: '실시간 스트리밍 대화',
    desc: '답변이 한 글자씩 실시간으로 생성되어 마치 실제로 대화하는 것 같은 경험을 제공해요.',
  },
  {
    icon: '✨',
    title: 'AI 자동 설계',
    desc: '이름만 입력하면 AI가 성격, 배경스토리, 말투를 자동으로 제안해줘요. 10초 만에 완성.',
  },
  {
    icon: '🛍️',
    title: '마켓플레이스',
    desc: '다른 사람이 만든 캐릭터와 대화하고, 내 캐릭터를 공개해서 공유할 수 있어요.',
  },
  {
    icon: '🌙',
    title: '다크모드 지원',
    desc: '눈이 편한 다크모드를 지원해요. 취향에 맞게 언제든지 전환할 수 있어요.',
  },
  {
    icon: '🔒',
    title: '안전한 개인정보',
    desc: '대화 내용은 암호화되어 안전하게 저장되며, 비공개 캐릭터는 본인만 볼 수 있어요.',
  },
]

const STEPS = [
  { num: '01', title: '캐릭터 만들기', desc: '이름과 성격을 입력하거나 AI 자동 생성으로 캐릭터를 설계하세요.' },
  { num: '02', title: '대화 시작', desc: '만들어진 캐릭터와 바로 대화를 시작하세요. 설정한 성격 그대로 반응해요.' },
  { num: '03', title: '공유 & 발견', desc: '캐릭터를 공개해서 다른 사람들과 공유하고, 마켓플레이스에서 새 캐릭터를 발견하세요.' },
]

const DEMO_MESSAGES = [
  { role: 'user', text: '안녕! 오늘 어떻게 지냈어?' },
  { role: 'ai', text: '어머, 드디어 왔구나! 나는 오늘 책을 세 권이나 읽었어 📚 너는요? 뭔가 재미있는 일 있었어?' },
  { role: 'user', text: '회사에서 발표가 있었는데 잘 됐어!' },
  { role: 'ai', text: '정말?! 대박이다!! 역시 네가 잘 할 줄 알았어 🎉 어떤 내용으로 발표했어? 나 너무 궁금한데~' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const c = useThemeColors()
  const isMobile = useIsMobile()
  const [visibleMsg, setVisibleMsg] = useState(0)

  // 데모 메시지 순차 표시
  useEffect(() => {
    if (visibleMsg >= DEMO_MESSAGES.length) return
    const t = setTimeout(() => setVisibleMsg((v) => v + 1), 900)
    return () => clearTimeout(t)
  }, [visibleMsg])

  return (
    <div style={{ background: c.bgPage, transition: 'background 0.2s ease' }}>

      {/* ── 히어로 ─────────────────────────────────────────── */}
      <section style={{ background: c.bgHero, padding: isMobile ? '3.5rem 1rem 4rem' : '5rem 1.5rem 6rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* 배경 장식 */}
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '999px', padding: '0.375rem 1rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8125rem', fontWeight: 600 }}>지금 바로 무료로 시작할 수 있어요</span>
          </div>

          <h1 style={{ color: 'white', fontSize: isMobile ? '2rem' : '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            내가 만든 AI 캐릭터와<br />대화하는 경험
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '1rem' : '1.125rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
            성격, 말투, 배경스토리를 직접 설정한 나만의 AI 캐릭터를 만들고,
            마켓플레이스에서 다른 사람들의 캐릭터와 대화해보세요.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{ background: 'white', color: '#6366f1', border: 'none', borderRadius: '14px', padding: isMobile ? '0.875rem 1.75rem' : '1rem 2.5rem', fontSize: isMobile ? '0.9375rem' : '1.0625rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            >
              무료로 시작하기 →
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '14px', padding: isMobile ? '0.875rem 1.75rem' : '1rem 2.5rem', fontSize: isMobile ? '0.9375rem' : '1.0625rem', fontWeight: 600, cursor: 'pointer' }}
            >
              마켓플레이스 둘러보기
            </button>
          </div>
        </div>

        {/* 데모 채팅 카드 */}
        <div style={{ maxWidth: '380px', margin: isMobile ? '2.5rem auto 0' : '3.5rem auto 0', background: c.isDark ? '#1e293b' : 'white', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: `1px solid ${c.border}` }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>📚</div>
            <div>
              <p style={{ fontWeight: 700, color: c.textPrimary, margin: 0, fontSize: '0.9375rem' }}>소피아</p>
              <p style={{ fontSize: '0.6875rem', color: '#10b981', margin: 0 }}>온라인</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', minHeight: '140px' }}>
            {DEMO_MESSAGES.slice(0, visibleMsg).map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '0.8125rem', lineHeight: 1.5, maxWidth: '85%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : c.bgSoft,
                  color: msg.role === 'user' ? 'white' : c.textPrimary,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {visibleMsg < DEMO_MESSAGES.length && (
              <div style={{ display: 'flex', gap: '4px', padding: '0.5rem 0.875rem', alignSelf: 'flex-start' }}>
                {[0,1,2].map((j) => (
                  <span key={j} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.textMuted, display: 'inline-block', animation: 'typingBounce 1.2s ease infinite', animationDelay: `${j * 0.2}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 통계 ───────────────────────────────────────────── */}
      <section style={{ background: c.bgCard, borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '2rem 1rem' : '2.5rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { num: '1,000+', label: '공개 캐릭터' },
            { num: '50,000+', label: '누적 대화' },
            { num: '5,000+', label: '활성 유저' },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, color: '#6366f1', margin: '0 0 0.25rem 0' }}>{s.num}</p>
              <p style={{ fontSize: '0.875rem', color: c.textSecondary, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 기능 소개 ──────────────────────────────────────── */}
      <section style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '3rem 1rem' : '5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <p style={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Features</p>
          <h2 style={{ color: c.textPrimary, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, margin: 0 }}>왜 Persona인가요?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: c.bgCard, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${c.border}` }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.875rem' }}>{f.icon}</div>
              <h3 style={{ color: c.textPrimary, fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{f.title}</h3>
              <p style={{ color: c.textSecondary, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 사용 방법 ──────────────────────────────────────── */}
      <section style={{ background: c.bgSofter, padding: isMobile ? '3rem 1rem' : '5rem 1.5rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
            <p style={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>How it works</p>
            <h2 style={{ color: c.textPrimary, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, margin: 0 }}>3단계로 시작하세요</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                  {step.num}
                </div>
                <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                  <h3 style={{ color: c.textPrimary, fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.375rem 0' }}>{step.title}</h3>
                  <p style={{ color: c.textSecondary, fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 요금제 프리뷰 ──────────────────────────────────── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: isMobile ? '3rem 1rem' : '5rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#6366f1', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pricing</p>
        <h2 style={{ color: c.textPrimary, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>무료로 시작, 필요할 때 업그레이드</h2>
        <p style={{ color: c.textSecondary, fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '2rem' }}>
          Free 플랜으로 충분히 경험해보고, 더 필요하면 Pro로 업그레이드하세요.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { name: 'Free', price: '무료', features: ['페르소나 3개', '일 50개 메시지', '기본 AI 모델'], highlight: false },
            { name: 'Pro', price: '₩9,900/월', features: ['페르소나 무제한', '메시지 무제한', '고성능 AI 모델'], highlight: true },
          ].map((p) => (
            <div key={p.name} style={{ background: c.bgCard, borderRadius: '16px', padding: '1.5rem', border: p.highlight ? '2px solid #6366f1' : `1px solid ${c.border}`, textAlign: 'left' }}>
              <p style={{ fontWeight: 700, color: p.highlight ? '#6366f1' : c.textPrimary, fontSize: '1rem', margin: '0 0 0.25rem 0' }}>{p.name}</p>
              <p style={{ fontWeight: 800, color: c.textPrimary, fontSize: '1.5rem', margin: '0 0 1rem 0' }}>{p.price}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {p.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: c.textSecondary }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/pricing')}
          style={{ background: 'none', border: `1.5px solid ${c.borderStrong}`, borderRadius: '12px', padding: '0.75rem 2rem', color: c.textSecondary, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}
        >
          전체 요금제 보기 →
        </button>
      </section>

      {/* ── 최종 CTA ───────────────────────────────────────── */}
      <section style={{ background: c.bgHero, padding: isMobile ? '3rem 1rem' : '5rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: isMobile ? '1.5rem' : '2.25rem', fontWeight: 800, marginBottom: '0.875rem', lineHeight: 1.25 }}>
          지금 바로 나만의<br />AI 캐릭터를 만들어보세요
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9375rem', marginBottom: '2rem' }}>무료로 시작할 수 있어요. 신용카드 필요 없음.</p>
        <button
          onClick={() => navigate('/register')}
          style={{ background: 'white', color: '#6366f1', border: 'none', borderRadius: '14px', padding: isMobile ? '0.875rem 2rem' : '1rem 3rem', fontSize: isMobile ? '0.9375rem' : '1.0625rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          무료로 시작하기 →
        </button>
      </section>

      {/* 푸터 */}
      <footer style={{ background: c.bgCard, borderTop: `1px solid ${c.border}`, padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>P</span>
            </div>
            <span style={{ fontWeight: 700, color: c.textPrimary, fontSize: '0.9375rem' }}>Persona</span>
          </div>
          <p style={{ color: c.textMuted, fontSize: '0.8125rem', margin: 0 }}>© 2025 Persona. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {['이용약관', '개인정보처리방침', '문의하기'].map((t) => (
              <span key={t} style={{ color: c.textMuted, fontSize: '0.8125rem', cursor: 'pointer' }}>{t}</span>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
