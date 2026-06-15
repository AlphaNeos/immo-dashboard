'use client'

import { type Bien } from '@/lib/supabase'

const PEB_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#15803d', color: '#fff' },
  B: { bg: '#22c55e', color: '#052e16' },
  C: { bg: '#84cc16', color: '#1a2e05' },
  D: { bg: '#facc15', color: '#422006' },
  E: { bg: '#fb923c', color: '#1c0a00' },
  F: { bg: '#f87171', color: '#1c0a00' },
  G: { bg: '#C1121F', color: '#fff' },
}

const RECO: Record<string, { color: string; bg: string; label: string }> = {
  ACHETER:  { color: '#2D6A4F', bg: 'rgba(45,106,79,0.1)',   label: 'ACHETER'  },
  NEGOCIER: { color: '#E07B39', bg: 'rgba(224,123,57,0.1)',  label: 'NÉGOCIER' },
  PASSER:   { color: '#C1121F', bg: 'rgba(193,18,31,0.1)',   label: 'PASSER'   },
  EVITER:   { color: '#C1121F', bg: 'rgba(193,18,31,0.1)',   label: 'PASSER'   },
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('fr-BE') + ' €'
}

function ScoreCircle({ score }: { score: number }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const pct = score / 10
  const color = score >= 8 ? '#2D6A4F' : score >= 5 ? '#E07B39' : '#C1121F'

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="#F0F0EB" strokeWidth={4} />
        <circle cx={28} cy={28} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, color, letterSpacing: '-0.02em',
      }}>
        {score}
      </div>
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
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1.5px solid transparent',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeSlideUp 0.4s ease both',
        animationDelay: `${Math.min(index * 0.05, 0.6)}s`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-3px) scale(1.01)'
        el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
        el.style.borderColor = 'var(--gold)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = ''
        el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
        el.style.borderColor = 'transparent'
      }}
    >
      {/* Top accent strip */}
      {reco && <div style={{ height: 3, backgroundColor: reco.color }} />}

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* Row 1: score circle + reco badge + PEB */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          {score > 0 ? (
            <ScoreCircle score={score} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#F0F0EB', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--muted)', fontWeight: 600,
            }}>—</div>
          )}

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
                backgroundColor: pebStyle.bg, color: pebStyle.color, letterSpacing: '0.05em',
              }}>
                PEB {peb}
              </span>
            )}
          </div>
        </div>

        {/* Title + city */}
        <div>
          <p style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
            lineHeight: 1.35, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
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
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          paddingTop: 12, borderTop: '1px solid var(--border)',
        }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
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
              <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: pv >= 0 ? '#2D6A4F' : '#C1121F' }}>
                {pv >= 0 ? '+' : ''}{fmt(pv)}
              </p>
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {bien.surface && <Chip>{bien.surface} m²</Chip>}
          {(bien.chambres ?? bien.nb_chambres) && <Chip>{bien.chambres ?? bien.nb_chambres} ch.</Chip>}
          {bien.terrain  && <Chip>{bien.terrain} m² terrain</Chip>}
          {jours != null && (
            <Chip accent={pressé}>
              {pressé ? (jours >= 120 ? '🔥' : '⏰') : '⏱'} {jours}j
            </Chip>
          )}
          {bien.source && <Chip>{bien.source}</Chip>}
        </div>

        {/* CTA */}
        {bien.url && (
          <a
            href={bien.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700,
              padding: '9px', borderRadius: 10, letterSpacing: '0.05em',
              border: '1.5px solid var(--border)', color: 'var(--muted)',
              textDecoration: 'none', transition: 'all 0.15s',
              textTransform: 'uppercase',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--accent)'
              el.style.color = 'var(--accent)'
              el.style.backgroundColor = '#F5F5F0'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = 'var(--border)'
              el.style.color = 'var(--muted)'
              el.style.backgroundColor = 'transparent'
            }}
          >
            Voir l&apos;annonce
          </a>
        )}
      </div>
    </div>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100,
      backgroundColor: accent ? 'rgba(224,123,57,0.1)' : '#F5F5F0',
      color: accent ? '#E07B39' : 'var(--muted)',
      border: `1px solid ${accent ? 'rgba(224,123,57,0.25)' : 'var(--border)'}`,
    }}>
      {children}
    </span>
  )
}
