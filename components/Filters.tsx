'use client'

export type FilterState = {
  recommandation: string
  source:         string
  commune:        string
  prixMax:        number
  scoreMin:       number
}

type Props = { filters: FilterState; onChange: (f: FilterState) => void }

const sel = "text-sm rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function Filters({ filters, onChange }: Props) {
  const set = (k: keyof FilterState, v: string | number) =>
    onChange({ ...filters, [k]: v })

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
         className="rounded-xl p-4 flex flex-wrap gap-3 items-end">

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'white' }}>Recommandation</label>
        <select style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                className={sel} value={filters.recommandation}
                onChange={e => set('recommandation', e.target.value)}>
          <option value="tous">Toutes</option>
          <option value="ACHETER">ACHETER</option>
          <option value="NEGOCIER">NÉGOCIER</option>
          <option value="EVITER">ÉVITER</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'white' }}>Source</label>
        <select style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                className={sel} value={filters.source}
                onChange={e => set('source', e.target.value)}>
          <option value="tous">Toutes</option>
          <option value="immoweb">Immoweb</option>
          <option value="immovlan">Immovlan</option>
          <option value="biddit">Biddit</option>
          <option value="notaire">Notaire</option>
          <option value="2ememain">2ememain</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'white' }}>Commune</label>
        <input style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
               className={`${sel} w-36`} placeholder="ex: Mons"
               value={filters.commune}
               onChange={e => set('commune', e.target.value)} />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'white' }}>Prix max : {filters.prixMax.toLocaleString()}€</label>
        <input type="range" min={30000} max={150000} step={5000}
               value={filters.prixMax}
               onChange={e => set('prixMax', Number(e.target.value))}
               className="w-32 accent-blue-500" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs" style={{ color: 'white' }}>Score IA min : {filters.scoreMin}/10</label>
        <input type="range" min={0} max={10} step={1}
               value={filters.scoreMin}
               onChange={e => set('scoreMin', Number(e.target.value))}
               className="w-24 accent-purple-500" />
      </div>

      <button onClick={() => onChange({ recommandation: 'tous', source: 'tous', commune: '', prixMax: 150000, scoreMin: 0 })}
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'white' }}
              className="text-xs px-3 py-1.5 rounded-md hover:text-white transition-colors">
        Réinitialiser
      </button>
    </div>
  )
}
