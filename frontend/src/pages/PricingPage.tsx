import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeColors } from '../hooks/useThemeColors'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../context/AuthContext'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    description: '가볍게 시작해보세요',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
    badge: null,
    features: [
      { label: '페르소나 생성', value: '최대 3개' },
      { label: '일일 메시지', value: '50개' },
      { label: '대화 기록 보관', value: '7일' },
      { label: 'AI 모델', value: '기본 모델' },
      { label: '마켓플레이스 이용', value: true },
      { label: '아바타 업로드', value: true },
      { label: '페르소나 자동 생성', value: '월 5회' },
      { label: '대화 요약', value: false },
      { label: '고성능 AI 모델', value: false },
      { label: '우선 지원', value: false },
    ],
    cta: '무료로 시작',
    ctaAction: 'register',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9900,
    priceLabel: '9,900원',
    description: '제한 없이 마음껏 대화하세요',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    badge: '가장 인기',
    features: [
      { label: '페르소나 생성', value: '무제한' },
      { label: '일일 메시지', value: '무제한' },
      { label: '대화 기록 보관', value: '무제한' },
      { label: 'AI 모델', value: '고성능 모델' },
      { label: '마켓플레이스 이용', value: true },
      { label: '아바타 업로드', value: true },
      { label: '페르소나 자동 생성', value: '무제한' },
      { label: '대화 요약', value: true },
      { label: '고성능 AI 모델', value: true },
      { label: '우선 지원', value: true },
    ],
    cta: 'Pro 시작하기',
    ctaAction: 'pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: '문의',
    description: '팀과 함께 사용하세요',
    color: '#0f172a',
    gradient: 'linear-gradient(135deg, #1e1b4b, #312e81)',
    badge: null,
    features: [
      { label: '페르소나 생성', value: '무제한' },
      { label: '일일 메시지', value: '무제한' },
      { label: '대화 기록 보관', value: '무제한' },
      { label: 'AI 모델', value: '고성능 모델' },
      { label: '마켓플레이스 이용', value: true },
      { label: '아바타 업로드', value: true },
      { label: '페르소나 자동 생성', value: '무제한' },
      { label: '대화 요약', value: true },
      { label: '고성능 AI 모델', value: true },
      { label: '팀 계정 관리', value: true },
      { label: 'API 접근', value: true },
      { label: '전담 지원', value: true },
    ],
    cta: '도입 문의',
    ctaAction: 'enterprise',
  },
]

const FAQS = [
  { q: '언제든지 취소할 수 있나요?', a: '네, 언제든지 구독을 취소할 수 있어요. 취소 후에도 결제한 기간 동안은 Pro 기능을 계속 사용할 수 있어요.' },
  { q: '무료 플랜에서 Pro로 업그레이드하면 기존 데이터는 유지되나요?', a: '물론이에요. 기존에 만든 페르소나와 대화 기록은 모두 유지됩니다.' },
  { q: '고성능 AI 모델은 어떻게 다른가요?', a: 'Pro 플랜은 더 자연스럽고 맥락을 잘 이해하는 고성능 언어 모델을 사용해요. 대화의 질이 눈에 띄게 달라집니다.' },
  { q: 'Enterprise 플랜은 어떤 경우에 필요한가요?', a: '팀원들과 함께 페르소나를 관리하거나, API로 연동이 필요하거나, 대량 사용이 필요한 기업에 적합해요.' },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const c = useThemeColors()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleCta = (action: string) => {
    if (action === 'register') navigate(user ? '/' : '/register')
    else if (action === 'pro') navigate(user ? '/profile' : '/register')
    else if (action === 'enterprise') window.location.href = 'mailto:contact@persona.ai'
  }

  const yearlyDiscount = 0.8

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: c.bgPage, transition: 'background 0.2s ease' }}>

      <div style={{ background: c.bgHero, padding: isMobile ? '2.5rem 1rem 3rem' : '3.5rem 1.5rem 4rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Pricing</p>
        <h1 style={{ color: 'white', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2 }}>
          당신에게 맞는 플랜을<br />선택하세요
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.9375rem' : '1.0625rem', marginBottom: '2rem' }}>
          무료로 시작하고, 필요할 때 업그레이드하세요
        </p>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.25rem', gap: '0.25rem' }}>
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                background: billing === b ? 'white' : 'transparent',
                color: billing === b ? '#6366f1' : 'rgba(255,255,255,0.8)',
                transition: 'all 0.15s',
              }}
            >
              {b === 'monthly' ? '월간' : '연간'}
              {b === 'yearly' && <span style={{ marginLeft: '0.375rem', background: '#10b981', color: 'white', fontSize: '0.6875rem', padding: '0.125rem 0.4rem', borderRadius: '999px' }}>20% 할인</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: isMobile ? '0 1rem' : '0 1.5rem', transform: 'translateY(-2rem)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
          {PLANS.map((plan) => {
            const displayPrice = billing === 'yearly' && plan.price
              ? Math.round(plan.price * yearlyDiscount)
              : plan.price
            const isPro = plan.id === 'pro'

            return (
              <div
                key={plan.id}
                style={{
                  background: c.bgCard,
                  borderRadius: '20px',
                  border: isPro ? '2px solid #6366f1' : `1.5px solid ${c.border}`,
                  overflow: 'hidden',
                  boxShadow: isPro ? '0 8px 32px rgba(99,102,241,0.2)' : c.shadowCard,
                  transform: isPro && !isMobile ? 'translateY(-8px)' : 'none',
                  position: 'relative',
                }}
              >

                {plan.badge && (
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '999px' }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ background: plan.gradient, padding: '1.5rem 1.5rem 1.25rem' }}>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.375rem 0' }}>{plan.name}</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem', marginBottom: '0.375rem' }}>
                    {plan.price !== null ? (
                      <>
                        <span style={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                          {displayPrice === 0 ? '0' : displayPrice?.toLocaleString()}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          원{billing === 'yearly' && plan.price ? '/월 (연결제)' : plan.price ? '/월' : ''}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'white', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>문의</span>
                    )}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', margin: 0 }}>{plan.description}</p>
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <ul style={{ listStyle: 'none', margin: '0 0 1.5rem 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {plan.features.map((f) => (
                      <li key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: f.value === false ? c.textMuted : c.textSecondary, textDecoration: f.value === false ? 'line-through' : 'none' }}>
                          {f.label}
                        </span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0 }}>
                          {f.value === true
                            ? <span style={{ color: '#10b981' }}>✓</span>
                            : f.value === false
                            ? <span style={{ color: c.textMuted }}>✗</span>
                            : <span style={{ color: isPro ? '#6366f1' : c.textPrimary }}>{f.value}</span>
                          }
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCta(plan.ctaAction)}
                    style={{
                      width: '100%', padding: '0.875rem', borderRadius: '12px', border: isPro ? 'none' : `1.5px solid ${c.borderStrong}`,
                      background: isPro ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'none',
                      color: isPro ? 'white' : c.textSecondary,
                      fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer',
                      boxShadow: isPro ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {!isMobile && (
        <div style={{ maxWidth: '1024px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
          <h2 style={{ textAlign: 'center', color: c.textPrimary, fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>플랜 상세 비교</h2>
          <div style={{ background: c.bgCard, borderRadius: '20px', border: `1px solid ${c.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${c.border}` }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: c.textSecondary, fontWeight: 500, fontSize: '0.875rem', width: '40%' }}>기능</th>
                  {PLANS.map((p) => (
                    <th key={p.id} style={{ padding: '1rem', textAlign: 'center', color: p.id === 'pro' ? '#6366f1' : c.textPrimary, fontWeight: 700 }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLANS[1].features.map((f, i) => (
                  <tr key={f.label} style={{ borderBottom: i < PLANS[1].features.length - 1 ? `1px solid ${c.border}` : 'none', background: i % 2 === 0 ? 'transparent' : (c.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') }}>
                    <td style={{ padding: '0.875rem 1.5rem', color: c.textSecondary, fontSize: '0.875rem' }}>{f.label}</td>
                    {PLANS.map((plan) => {
                      const planFeature = plan.features.find((pf) => pf.label === f.label)
                      const val = planFeature?.value
                      return (
                        <td key={plan.id} style={{ padding: '0.875rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                          {val === true
                            ? <span style={{ color: '#10b981', fontSize: '1.125rem' }}>✓</span>
                            : val === false || val === undefined
                            ? <span style={{ color: c.textMuted }}>—</span>
                            : <span style={{ color: plan.id === 'pro' ? '#6366f1' : c.textPrimary }}>{val}</span>
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '680px', margin: '0 auto 5rem', padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
        <h2 style={{ textAlign: 'center', color: c.textPrimary, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>자주 묻는 질문</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{ background: c.bgCard, borderRadius: '14px', border: `1px solid ${openFaq === i ? '#6366f1' : c.border}`, overflow: 'hidden', transition: 'border-color 0.15s' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', textAlign: 'left' }}
              >
                <span style={{ fontWeight: 600, color: c.textPrimary, fontSize: '0.9375rem' }}>{faq.q}</span>
                <span style={{ color: openFaq === i ? '#6366f1' : c.textMuted, fontSize: '1.125rem', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 1.25rem 1rem', color: c.textSecondary, fontSize: '0.9375rem', lineHeight: 1.7, borderTop: `1px solid ${c.border}`, paddingTop: '0.875rem' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: c.bgHero, padding: isMobile ? '2.5rem 1rem' : '3rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: isMobile ? '1.375rem' : '1.875rem', fontWeight: 700, marginBottom: '0.75rem' }}>지금 바로 시작하세요</h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>무료로 시작하고, 언제든지 업그레이드할 수 있어요</p>
        <button
          onClick={() => navigate(user ? '/' : '/register')}
          style={{ background: 'white', color: '#6366f1', border: 'none', borderRadius: '14px', padding: '0.875rem 2.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
        >
          {user ? '마켓플레이스 가기' : '무료로 시작하기'}
        </button>
      </div>
    </div>
  )
}
