'use client'

import { motion } from 'framer-motion'

export type FilterState = {
  recommandation: string
  commune:        string
  prixMax:        number
  scoreMin:       number
}

type Props = { filters: FilterState; onChange: (f: FilterState) => void }

const RECOS = [
  { value: 'tous',     label: 'Tous',     color: '#6B4EFF' },
  { value: 'ACHETER',  label: 'Acheter',  color: '#1A7A4A' },
  { value: 'NEGOCIER', label: 'Négocier', color: '#E07B39' },
  { value: 'PASSER',   label: 'Passer',   color: '#C1121F' },
]

export default function Filters({ filters, onChange }: Props) {
  const set = (k: keyof FilterState, v: string | number) =>
    onChange({ ...filters, [k]: v })
  const reset = () => onChange({ recommandation: 'tous', commune: '', prixMax: 120000, scoreMin: 0 })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: 'var(--card)',
        borderRadius: 16,
        padding: '18px 24px',
        boxShadow: '0 2px 16px rgba(26,16,96,0.07)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        alignItems: 'flex-end',
      }}
    >
      {/* Recommandation pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Recommandation
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {RECOS.map(r => {
            const active = filters.recommandation === r.value
            return (
              <motion.button
                key={r.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => set('recommandation', r.value)}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 100,
                  border: `1.5px solid ${active ? r.color : 'var(--border-soft)'}`,
                  backgroundColor: active ? r.color : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.02em',
                }}
              >
                {r.label}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Commune */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 170 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Commune
        </label>
        <input
          style={{
            backgroundColor: 'var(--bg)', border: '1.5px solid var(--border-soft)',
            borderRadius: 10, color: 'var(--text)', fontSize: 13,
            padding: '9px 14px', outline: 'none', width: '100%',
            transition: 'border-color 0.2s',
          }}
          placeholder="ex: Mons, Liège…"
          value={filters.commune}
          onChange={e => set('commune', e.target.value)}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--purple)' }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-soft)' }}
        />
      </div>

      {/* Prix max */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Prix max
          <span style={{ color: 'var(--purple)', fontWeight: 800, marginLeft: 8 }}>
            {filters.prixMax.toLocaleString('fr-BE')} €
          </span>
        </label>
        <input type="range" min={20000} max={120000} step={5000}
               value={filters.prixMax}
               onChange={e => set('prixMax', Number(e.target.value))}
               style={{ width: 170 }} />
      </div>

      {/* Score min */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Score IA min
          <span style={{ color: 'var(--purple)', fontWeight: 800, marginLeft: 8 }}>
            {filters.scoreMin}/10
          </span>
        </label>
        <input type="range" min={0} max={10} step={1}
               value={filters.scoreMin}
               onChange={e => set('scoreMin', Number(e.target.value))}
               style={{ width: 130 }} />
      </div>

      <button onClick={reset} style={{
        fontSize: 11, fontWeight: 700, padding: '9px 18px', borderRadius: 100,
        cursor: 'pointer', border: '1.5px solid var(--border-soft)',
        backgroundColor: 'transparent', color: 'var(--muted)',
        marginLeft: 'auto', letterSpacing: '0.05em', textTransform: 'uppercase',
        transition: 'all 0.2s',
      }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--purple)'; el.style.color = 'var(--purple)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border-soft)'; el.style.color = 'var(--muted)' }}
      >
        Réinitialiser
      </button>
    </motion.div>
  )
}
