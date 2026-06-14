type Stats = { total: number; acheter: number; negocier: number; eviter: number; analyses: number }

export default function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Biens détectés',  value: stats.total,    color: '#3b82f6' },
    { label: 'Analysés par IA', value: stats.analyses, color: '#8b5cf6' },
    { label: '🟢 ACHETER',      value: stats.acheter,  color: '#22c55e' },
    { label: '🟡 NÉGOCIER',     value: stats.negocier, color: '#eab308' },
    { label: '🔴 ÉVITER',       value: stats.eviter,   color: '#ef4444' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label}
             style={{ backgroundColor: 'var(--surface)', borderLeft: `3px solid ${c.color}`, border: `1px solid var(--border)`, borderLeftColor: c.color }}
             className="rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{c.value}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{c.label}</p>
        </div>
      ))}
    </div>
  )
}
