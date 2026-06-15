'use client'

export type FilterState = {
  recommandation: string
  commune:        string
  prixMax:        number
  scoreMin:       number
}

type Props = { filters: FilterState; onChange: (f: FilterState) => void }

const RECOS = [
  { value: 'tous',     label: 'Tous',      color: '#1A1A1A' },
  { value: 'ACHETER',  label: 'ACHETER',   color: '#2D6A4F' },
  { value: 'NEGOCIER', label: 'NÉGOCIER',  color: '#E07B39' },
  { value: 'PASSER',   label: 'PASSER',    color: '#C1121F' },
]

export default function Filters({ filters, onChange }: Props) {
  const set = (k: keyof FilterState, v: string | number) =>
    onChange({ ...filters, [k]: v })

  const reset = () => onChange({ recommandation: 'tous', commune: '', prixMax: 120000, scoreMin: 0 })

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      borderRadius: 16,
      padding: '18px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'flex-end',
    }}>

      {/* Recommandation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Recommandation
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {RECOS.map(r => {
            const active = filters.recommandation === r.value
            return (
              <button key={r.value} onClick={() => set('recommandation', r.value)} style={{
                fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 100,
                border: `1.5px solid ${active ? r.color : 'var(--border)'}`,
                backgroundColor: active ? r.color : 'transparent',
                color: active ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.04em',
              }}>
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Commune */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Commune
        </label>
        <input
          style={{
            backgroundColor: '#F5F5F0', border: '1.5px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: 13,
            padding: '8px 12px', outline: 'none', width: '100%',
            transition: 'border-color 0.15s',
          }}
          placeholder="ex: Mons, Liège…"
          value={filters.commune}
          onChange={e => set('commune', e.target.value)}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)' }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)' }}
        />
      </div>

      {/* Prix max */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Prix max
          <span style={{ color: 'var(--text)', fontWeight: 800, marginLeft: 8 }}>
            {filters.prixMax.toLocaleString('fr-BE')} €
          </span>
        </label>
        <input type="range" min={20000} max={120000} step={5000}
               value={filters.prixMax}
               onChange={e => set('prixMax', Number(e.target.value))}
               style={{ width: 160 }} />
      </div>

      {/* Score min */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Score min
          <span style={{ color: 'var(--text)', fontWeight: 800, marginLeft: 8 }}>
            {filters.scoreMin}/10
          </span>
        </label>
        <input type="range" min={0} max={10} step={1}
               value={filters.scoreMin}
               onChange={e => set('scoreMin', Number(e.target.value))}
               style={{ width: 120 }} />
      </div>

      <button onClick={reset} style={{
        fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 100,
        cursor: 'pointer', border: '1.5px solid var(--border)',
        backgroundColor: 'transparent', color: 'var(--muted)',
        marginLeft: 'auto', letterSpacing: '0.04em', textTransform: 'uppercase',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--text)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--muted)' }}
      >
        Réinitialiser
      </button>
    </div>
  )
}
