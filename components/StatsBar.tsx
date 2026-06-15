type Stats = { total: number; acheter: number; negocier: number; passer: number; analyses: number }

export default function StatsBar({ stats }: { stats: Stats }) {
  const cards = [
    { label: 'Biens détectés',  value: stats.total,    color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  sub: 'total scrapés' },
    { label: 'Analysés IA',     value: stats.analyses, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', sub: 'avec score' },
    { label: 'ACHETER',         value: stats.acheter,  color: '#22C55E', bg: 'rgba(34,197,94,0.1)',  sub: 'score 8-10' },
    { label: 'NÉGOCIER',        value: stats.negocier, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', sub: 'score 5-7' },
    { label: 'PASSER',          value: stats.passer,   color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  sub: 'score 1-4' },
  ]

  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(5, 1fr)' }}>
      {cards.map(c => (
        <div key={c.label} style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Accent top border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${c.color}, transparent)`,
          }} />
          {/* Glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 60,
            background: `radial-gradient(ellipse at top left, ${c.bg}, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{ fontSize: 28, fontWeight: 800, color: c.color, lineHeight: 1, letterSpacing: '-0.02em', position: 'relative' }}>
            {c.value}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 6, position: 'relative' }}>
            {c.label}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, position: 'relative' }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
