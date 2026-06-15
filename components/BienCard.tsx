'use client'

import { type Bien } from '@/lib/supabase'

const PEB_COLORS: Record<string, { bg: string; color: string }> = {
  A: { bg: '#15803d', color: '#fff' },
  B: { bg: '#22c55e', color: '#052e16' },
  C: { bg: '#84cc16', color: '#1a2e05' },
  D: { bg: '#facc15', color: '#422006' },
  E: { bg: '#fb923c', color: '#1c0a00' },
  F: { bg: '#f87171', color: '#1c0a00' },
  G: { bg: '#ef4444', color: '#fff' },
}

const RECO: Record<string, { color: string; bg: string; label: string }> = {
  ACHETER:  { color: '#22C55E', bg: 'rgba(34,197,94,0.13)',  label: 'ACHETER'  },
  NEGOCIER: { color: '#F59E0B', bg: 'rgba(245,158,11,0.13)', label: 'NÉGOCIER' },
  PASSER:   { color: '#EF4444', bg: 'rgba(239,68,68,0.13)',  label: 'PASSER'   },
  EVITER:   { color: '#EF4444', bg: 'rgba(239,68,68,0.13)',  label: 'PASSER'   },
}

function fmt(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('fr-BE') + ' €'
}

export default function BienCard({ bien, onClick }: { bien: Bien; onClick: () => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = bien.analyse_ia || {}
  const ar = a.achat_revente || {}
  const pv: number | undefined = ar.plus_value_nette ?? bien.plus_value_estimee

  const score = bien.score_ia ?? 0
  const recoKey = bien.recommandation || ''
  const reco = RECO[recoKey]
  const scoreColor = score >= 8 ? '#22C55E' : score >= 5 ? '#F59E0B' : score > 0 ? '#EF4444' : 'var(--muted)'

  const peb = (bien.peb ?? '').toUpperCase().slice(0, 1)
  const pebStyle = PEB_COLORS[peb]

  const jours = bien.jours_en_ligne
  const pressé = jours != null && jours >= 60

  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
        textAlign: 'left',
        width: '100%',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border-hover)'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      {/* Accent bar */}
      {reco && <div style={{ height: 3, backgroundColor: reco.color, flexShrink: 0 }} />}

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Row 1: score + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, color: scoreColor, letterSpacing: '-0.02em' }}>
              {score > 0 ? score : '—'}
            </span>
            {score > 0 && (
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/10</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {reco && (
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                padding: '4px 9px', borderRadius: 6,
                color: reco.color, backgroundColor: reco.bg,
                border: `1px solid ${reco.color}30`,
              }}>
                {reco.label}
              </span>
            )}
            {pebStyle && peb && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                backgroundColor: pebStyle.bg, color: pebStyle.color,
              }}>
                PEB {peb}
              </span>
            )}
          </div>
        </div>

        {/* Title + city */}
        <div>
          <p style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35,
            margin: 0, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {bien.titre || (bien.ville ? `Bien — ${bien.ville}` : 'Bien immobilier')}
          </p>
          {bien.ville && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
              {bien.ville}{bien.code_postal ? ` · ${bien.code_postal}` : ''}
            </p>
          )}
        </div>

        {/* Prix + plus-value */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
              {fmt(bien.prix)}
            </p>
            {bien.prix_precedent && (
              <p style={{ fontSize: 11, color: '#F59E0B', margin: '2px 0 0' }}>
                ↓ était {fmt(bien.prix_precedent)}
              </p>
            )}
          </div>
          {pv != null && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', margin: 0 }}>plus-value</p>
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: pv >= 0 ? '#22C55E' : '#EF4444' }}>
                {pv >= 0 ? '+' : ''}{fmt(pv)}
              </p>
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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
              display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 600,
              padding: '8px', borderRadius: 8,
              border: '1px solid var(--border)', color: 'var(--muted-2)',
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.borderColor = 'var(--indigo)'
              el.style.color = 'var(--indigo)'
              el.style.backgroundColor = 'var(--indigo-dim)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.borderColor = 'var(--border)'
              el.style.color = 'var(--muted-2)'
              el.style.backgroundColor = 'transparent'
            }}
          >
            Voir l&apos;annonce →
          </a>
        )}
      </div>
    </button>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20,
      backgroundColor: accent ? 'rgba(245,158,11,0.1)' : 'var(--surface-2)',
      color: accent ? '#F59E0B' : 'var(--muted-2)',
      border: `1px solid ${accent ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
    }}>
      {children}
    </span>
  )
}
