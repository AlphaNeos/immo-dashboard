'use client'

export type FilterState = {
  recommandation: string
  commune:        string
  prixMax:        number
  scoreMin:       number
}

type Props = { filters: FilterState; onChange: (f: FilterState) => void }

const RECOS = [
  { value: 'tous',     label: 'Toutes',    color: 'var(--muted)' },
  { value: 'ACHETER',  label: 'ACHETER',   color: '#22C55E' },
  { value: 'NEGOCIER', label: 'NÉGOCIER',  color: '#F59E0B' },
  { value: 'PASSER',   label: 'PASSER',    color: '#EF4444' },
]

export default function Filters({ filters, onChange }: Props) {
  const set = (k: keyof FilterState, v: string | number) =>
    onChange({ ...filters, [k]: v })

  const reset = () => onChange({ recommandation: 'tous', commune: '', prixMax: 120000, scoreMin: 0 })

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text)',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
      alignItems: 'flex-end',
    }}>

      {/* Recommandation — pill buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recommandation
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {RECOS.map(r => {
            const active = filters.recommandation === r.value
            return (
              <button key={r.value} onClick={() => set('recommandation', r.value)} style={{
                fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20,
                border: `1px solid ${active ? r.color : 'var(--border)'}`,
                backgroundColor: active ? `${r.color}18` : 'transparent',
                color: active ? r.color : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Commune */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Commune
        </label>
        <input
          style={inputStyle}
          placeholder="ex: Mons, Liège…"
          value={filters.commune}
          onChange={e => set('commune', e.target.value)}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--indigo)' }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)' }}
        />
      </div>

      {/* Prix max */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Prix max
          <span style={{ color: 'var(--text)', fontWeight: 700, marginLeft: 6 }}>
            {filters.prixMax.toLocaleString('fr-BE')}€
          </span>
        </label>
        <input type="range" min={20000} max={120000} step={5000}
               value={filters.prixMax}
               onChange={e => set('prixMax', Number(e.target.value))}
               style={{
                 width: 160, height: 3, borderRadius: 2, outline: 'none',
                 background: `linear-gradient(to right, var(--indigo) ${((filters.prixMax - 20000) / 100000) * 100}%, var(--border) 0%)`,
                 WebkitAppearance: 'none', appearance: 'none', cursor: 'pointer',
               }} />
      </div>

      {/* Score IA min */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Score IA min
          <span style={{ color: 'var(--text)', fontWeight: 700, marginLeft: 6 }}>
            {filters.scoreMin}/10
          </span>
        </label>
        <input type="range" min={0} max={10} step={1}
               value={filters.scoreMin}
               onChange={e => set('scoreMin', Number(e.target.value))}
               style={{
                 width: 120, height: 3, borderRadius: 2, outline: 'none',
                 background: `linear-gradient(to right, #8B5CF6 ${filters.scoreMin * 10}%, var(--border) 0%)`,
                 WebkitAppearance: 'none', appearance: 'none', cursor: 'pointer',
               }} />
      </div>

      {/* Reset */}
      <button onClick={reset} style={{
        fontSize: 12, fontWeight: 500, padding: '8px 16px',
        borderRadius: 8, cursor: 'pointer',
        border: '1px solid var(--border)',
        backgroundColor: 'transparent',
        color: 'var(--muted)',
        marginLeft: 'auto',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
      >
        Réinitialiser
      </button>
    </div>
  )
}
