'use client'

import { useEffect, useRef } from 'react'

type Stats = { total: number; acheter: number; negocier: number; passer: number; analyses: number }

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = prev.current
    const end = value
    prev.current = value
    if (start === end) { el.textContent = String(end); return }
    const duration = 600
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      el.textContent = String(Math.round(start + (end - start) * ease))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return <span ref={ref}>{value}</span>
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Biens détectés',  value: stats.total,    borderColor: 'var(--accent)',  sub: 'total scrapés'  },
    { label: 'Analysés IA',     value: stats.analyses, borderColor: '#C8956C',        sub: 'avec score IA'  },
    { label: 'ACHETER',         value: stats.acheter,  borderColor: 'var(--green)',   sub: 'opportunités'   },
    { label: 'NÉGOCIER',        value: stats.negocier, borderColor: 'var(--orange)',  sub: 'à négocier'     },
    { label: 'PASSER',          value: stats.passer,   borderColor: 'var(--red)',     sub: 'non rentables'  },
  ]

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {cards.map((c, i) => (
        <div key={c.label} style={{
          backgroundColor: 'var(--card)',
          borderRadius: 16,
          padding: '22px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          borderLeft: `3px solid ${c.borderColor}`,
          animation: `countUp 0.4s ease both`,
          animationDelay: `${i * 0.06}s`,
        }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.03em' }}>
            <AnimatedNumber value={c.value} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {c.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
