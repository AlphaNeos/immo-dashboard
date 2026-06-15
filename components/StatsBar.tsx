'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

type Stats = { total: number; acheter: number; negocier: number; passer: number; analyses: number }

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const start = prev.current
    prev.current = value
    if (start === value) { el.textContent = String(value); return }
    const duration = 900
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      el.textContent = String(Math.round(start + (value - start) * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])

  return <span ref={ref} style={{ color }}>{value}</span>
}

const CARDS = [
  { key: 'total',    label: 'Biens détectés', sub: 'scrapés',     color: '#1A1060', accent: '#6B4EFF' },
  { key: 'analyses', label: 'Analysés IA',    sub: 'avec score',  color: '#1A1060', accent: '#6B4EFF' },
  { key: 'acheter',  label: 'ACHETER',        sub: 'opportunités',color: '#1A7A4A', accent: '#1A7A4A' },
  { key: 'negocier', label: 'NÉGOCIER',       sub: 'à négocier',  color: '#E07B39', accent: '#E07B39' },
  { key: 'passer',   label: 'PASSER',         sub: 'sans intérêt',color: '#C1121F', accent: '#C1121F' },
] as const

export default function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {CARDS.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          style={{
            backgroundColor: 'var(--card)',
            borderRadius: 16,
            padding: '22px 22px 18px',
            boxShadow: '0 2px 16px rgba(26,16,96,0.07)',
            borderTop: `3px solid ${c.accent}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* soft glow bg */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 80,
            background: `radial-gradient(ellipse at top left, ${c.accent}0A, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', position: 'relative' }}>
            <AnimatedNumber value={stats[c.key]} color={c.color} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {c.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{c.sub}</div>
        </motion.div>
      ))}
    </div>
  )
}
