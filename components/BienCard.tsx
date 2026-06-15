'use client'

import { motion } from 'framer-motion'
import { type Bien } from '@/lib/supabase'

const PEB_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#16a34a', color: '#fff' },
  B: { bg: '#4ade80', color: '#052e16' },
  C: { bg: '#a3e635', color: '#1a2e05' },
  D: { bg: '#facc15', color: '#422006' },
  E: { bg: '#fb923c', color: '#1c0a00' },
  F: { bg: '#f87171', color: '#1c0a00' },
  G: { bg: '#C1121F', color: '#fff' },
}

const RECO: Record<string, { color: string; bg: string; label: string }> = {
  ACHETER:  { color: '#1A7A4A', bg: 'rgba(26,122,74,0.1)',   label: 'ACHETER'  },
  NEGOCIER: { color: '#E07B39', bg: 'rgba(224,123,57,0.1)',  label: 'NÉGOCIER' },
  PASSER:   { color: '#C1121F', bg: 'rgba(193,18,31,0.1)',   label: 'PASSER'   },
  EVITER:   { color: '#C1121F', bg: 'rgba(193,18,31,0.1)',   label: 'PASSER'   },
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('fr-BE') + ' €'
}

function ScoreRing({ score }: { score: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const pct = score / 10
  const color = score >= 8 ? '#1A7A4A' : score >= 5 ? '#E07B39' : '#C1121F'
  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="var(--border-soft)" strokeWidth={4} />
        <motion.circle
          cx={26} cy={26} r={r} fill="none"
          stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color,
      }}>
        {score}
      </div>
    </div>
  )
}

export function BienCardSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'linear-gradient(90deg, #EBEBF8 25%, #F5F5FF 50%, #EBEBF8 75%)',
    backgroundSize: '800px 100%',
    animation: 'skeleton 1.4s ease infinite',
    borderRadius: 8,
  }
  return (
    <div style={{
      backgroundColor: 'var(--card)', borderRadius: 16,
      padding: '20px', boxShadow: '0 2px 16px rgba(26,16,96,0.07)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ ...shimmer, width: 52, height: 52, borderRadius: '50%' }} />
        <div style={{ ...shimmer, width: 70, height: 24 }} />
      </div>
      <div style={{ ...shimmer, height: 16, width: '80%' }} />
      <div style={{ ...shimmer, height: 12, width: '50%' }} />
      <div style={{ ...shimmer, height: 24, width: '60%' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {[60, 50, 70].map((w, i) => (
          <div key={i} style={{ ...shimmer, height: 22, width: w }} />
        ))}
      </div>
      <div style={{ ...shimmer, height: 36, borderRadius: 10 }} />
    </div>
  )
}

export default function BienCard({ bien, onClick, index = 0 }: { bien: Bien; onClick: () => void; index?: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = bien.analyse_ia || {}
  const ar = a.achat_revente || {}
  const pv: number | undefined = ar.plus_value_nette ?? bien.plus_value_estimee

  const score = bien.score_ia ?? 0
  const recoKey = bien.recommandation || ''
  const reco = RECO[recoKey]

  const peb = (bien.peb ?? '').toUpperCase().slice(0, 1)
  const pebStyle = PEB_COLORS[peb]

  const jours = bien.jours_en_ligne
  const pressé = jours != null && jours >= 60

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.5), ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(107,78,255,0.18)' }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(26,16,96,0.07)',
        border: '1.5px solid transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      onHoverStart={e => { (e.target as HTMLElement).closest('[data-card]') }}
    >
      {/* Top accent */}
      {reco && <div style={{ height: 3, background: `linear-gradient(90deg, ${reco.color}, ${reco.color}88)` }} />}

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* Score + reco */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {score > 0
            ? <ScoreRing score={score} />
            : <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>—</div>
          }
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {reco && (
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: 100,
                color: reco.color, backgroundColor: reco.bg,
              }}>
                {reco.label}
              </span>
            )}
            {pebStyle && peb && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                backgroundColor: pebStyle.bg, color: pebStyle.color,
              }}>
                PEB {peb}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <p style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {bien.titre || (bien.ville ? `Bien — ${bien.ville}` : 'Bien immobilier')}
          </p>
          {bien.ville && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>
              {bien.ville}{bien.code_postal ? ` · ${bien.code_postal}` : ''}
            </p>
          )}
        </div>

        {/* Prix + plus-value */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.02em' }}>
              {fmt(bien.prix)}
            </p>
            {bien.prix_precedent && (
              <p style={{ fontSize: 11, color: 'var(--orange)', margin: '2px 0 0', fontWeight: 600 }}>
                ↓ était {fmt(bien.prix_precedent)}
              </p>
            )}
          </div>
          {pv != null && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>plus-value</p>
              <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: pv >= 0 ? '#1A7A4A' : '#C1121F' }}>
                {pv >= 0 ? '+' : ''}{fmt(pv)}
              </p>
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {bien.surface && <Chip>{bien.surface} m²</Chip>}
          {(bien.chambres ?? bien.nb_chambres) && <Chip>{bien.chambres ?? bien.nb_chambres} ch.</Chip>}
          {bien.terrain  && <Chip>{bien.terrain} m²</Chip>}
          {jours != null && <Chip accent={pressé}>{pressé ? (jours >= 120 ? '🔥' : '⏰') : '⏱'} {jours}j</Chip>}
          {bien.source   && <Chip>{bien.source}</Chip>}
        </div>

        {/* CTA */}
        {bien.url && (
          <motion.a
            href={bien.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            whileHover={{ backgroundColor: '#5A3DEE' }}
            style={{
              display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700,
              padding: '10px', borderRadius: 10,
              backgroundColor: 'var(--purple)', color: '#fff',
              textDecoration: 'none', transition: 'background-color 0.2s',
              letterSpacing: '0.04em',
            }}
          >
            Voir l&apos;annonce →
          </motion.a>
        )}
      </div>
    </motion.div>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100,
      backgroundColor: accent ? 'rgba(224,123,57,0.1)' : 'var(--bg)',
      color: accent ? '#E07B39' : 'var(--muted)',
      border: `1px solid ${accent ? 'rgba(224,123,57,0.25)' : 'var(--border-soft)'}`,
    }}>
      {children}
    </span>
  )
}
