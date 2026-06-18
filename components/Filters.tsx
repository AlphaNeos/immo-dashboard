'use client'
import { motion } from 'framer-motion'

export interface FilterState {
  recommandation: string
  commune: string
  prixMax: number
  scoreMin: number
}

const PILLS = [
  { value: 'tous',     label: 'Tous',      bg: 'var(--violet)', color: '#fff' },
  { value: 'ACHETER',  label: 'ACHETER',   bg: 'var(--green)',  color: '#0F172A' },
  { value: 'NEGOCIER', label: 'NÉGOCIER',  bg: 'var(--amber)',  color: '#0F172A' },
  { value: 'PASSER',   label: 'PASSER',    bg: 'var(--red)',    color: '#fff' },
]

export default function Filters({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4 }}>
        Filtrer
      </span>

      {PILLS.map(p => {
        const active = filters.recommandation === p.value
        return (
          <motion.button
            key={p.value}
            whileTap={{ scale: 0.94 }}
            onClick={() => set({ recommandation: p.value })}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: `1px solid ${active ? p.bg : 'var(--border)'}`,
              background: active ? p.bg : 'transparent',
              color: active ? p.color : 'var(--muted)',
              transition: 'all 0.15s',
              boxShadow: active ? `0 0 14px ${p.bg}55` : 'none',
            }}
          >
            {p.label}
          </motion.button>
        )
      })}

      <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

      <input
        type="text"
        placeholder="Commune, code postal..."
        value={filters.commune}
        onChange={e => set({ commune: e.target.value })}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
          padding: '7px 14px', fontSize: 12, color: 'var(--text)', outline: 'none',
          fontFamily: 'Inter, sans-serif', width: 200,
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--violet)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <span style={{ fontSize: 11, color: 'var(--muted2)' }}>Score min</span>
        <input
          type="range" min={0} max={90} step={5} value={filters.scoreMin}
          onChange={e => set({ scoreMin: Number(e.target.value) })}
          style={{ accentColor: 'var(--violet)', width: 80 }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet)', width: 24, fontVariantNumeric: 'tabular-nums' }}>
          {filters.scoreMin}
        </span>
      </div>
    </div>
  )
}
