'use client'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Stats {
  total: number
  acheter: number
  negocier: number
  passer: number
  analyses: number
}

function AnimatedNumber({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let start = 0
    const duration = 900
    const startTime = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      const val = Math.round(ease * target)
      if (ref.current) ref.current.textContent = String(val)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return <span ref={ref}>0</span>
}

const SPARKLINES: Record<string, string> = {
  total:    '0,20 13,16 26,18 39,10 52,13 65,7 80,4',
  acheter:  '0,22 13,18 26,15 39,12 52,8 65,5 80,2',
  negocier: '0,18 13,14 26,17 39,12 52,15 65,10 80,8',
  passer:   '0,4  13,8  26,6  39,12 52,10 65,16 80,18',
  analyses: '0,20 13,16 26,14 39,10 52,8 65,5 80,3',
}

const CARDS = [
  { key: 'total',    label: 'Total détectés', sub: 'biens scannés',   accent: 'var(--violet)', color: 'var(--violet)' },
  { key: 'acheter',  label: 'ACHETER',         sub: 'opportunités',    accent: 'var(--green)',  color: 'var(--green)'  },
  { key: 'negocier', label: 'NÉGOCIER',        sub: 'à discuter',      accent: 'var(--amber)',  color: 'var(--amber)'  },
  { key: 'passer',   label: 'PASSER',          sub: 'à éviter',        accent: 'var(--red)',    color: 'var(--red)'    },
  { key: 'analyses', label: 'Analysés IA',     sub: 'score calculé',   accent: 'var(--gold)',   color: 'var(--gold)'   },
]

export default function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
      {CARDS.map((c, i) => (
        <motion.div
          key={c.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: 'easeOut' }}
          whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.35)' }}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
          }}
        >
          {/* accent top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            borderRadius: '16px 16px 0 0',
            background: `linear-gradient(90deg, ${c.accent}, ${c.accent}99)`,
          }} />
          {/* glow orb */}
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: c.accent, opacity: 0.07,
          }} />

          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            {c.label}
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: c.color, fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedNumber target={stats[c.key as keyof Stats]} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 6 }}>{c.sub}</div>

          {/* sparkline */}
          <div style={{ marginTop: 12, opacity: 0.7 }}>
            <svg width="80" height="24" viewBox="0 0 80 24">
              <polyline
                points={SPARKLINES[c.key]}
                fill="none"
                stroke={c.accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
