import { Bien } from '@/lib/supabase'

const RECO_COLORS: Record<string, string> = {
  ACHETER:  '#22c55e',
  NEGOCIER: '#eab308',
  EVITER:   '#ef4444',
}
const RECO_EMOJI: Record<string, string> = {
  ACHETER: '🟢', NEGOCIER: '🟡', EVITER: '🔴',
}

function fmt(n: number | null | undefined) {
  if (!n) return '—'
  return n.toLocaleString('fr-BE') + '€'
}

export default function BienCard({ bien, onClick }: { bien: Bien; onClick: () => void }) {
  const analyse   = bien.analyse_ia as Record<string, unknown> | null
  const ar        = (analyse?.achat_revente as Record<string, number> | null) || {}
  const pvNette   = ar.plus_value_nette
  const reco      = bien.recommandation || ''
  const recoColor = RECO_COLORS[reco] || '#64748b'
  const scoreIA   = bien.score_ia || 0

  const jours = bien.jours_en_ligne
  const remise = bien.nb_remises_en_vente
  const sources = (bien.sources_vues || [bien.source]).join(', ')

  return (
    <button onClick={onClick} className="text-left w-full rounded-xl overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>

      {/* Barre couleur recommandation */}
      <div style={{ backgroundColor: recoColor, height: '3px' }} />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {bien.titre || `Maison ${bien.ville || ''}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              📍 {bien.ville || bien.adresse || '—'}
            </p>
          </div>
          {reco && (
            <span className="text-xs font-bold px-2 py-1 rounded-md shrink-0 whitespace-nowrap"
                  style={{ backgroundColor: `${recoColor}20`, color: recoColor }}>
              {RECO_EMOJI[reco]} {reco}
            </span>
          )}
        </div>

        {/* Prix + caractéristiques */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xl font-bold text-white">{fmt(bien.prix)}</p>
            {bien.prix !== bien.prix_initial && bien.prix_initial && (
              <p className="text-xs line-through" style={{ color: 'var(--muted)' }}>{fmt(bien.prix_initial)}</p>
            )}
          </div>
          <div className="text-xs space-y-0.5" style={{ color: 'var(--muted)' }}>
            {bien.chambres && <p>🛏 {bien.chambres} ch.</p>}
            {bien.surface  && <p>📐 {bien.surface} m²</p>}
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3">
          {scoreIA > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ width: 4, height: 10, borderRadius: 2,
                    backgroundColor: i < scoreIA ? recoColor : 'var(--border)' }} />
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: recoColor }}>{scoreIA}/10</span>
            </div>
          )}
          <span className="text-xs" style={{ color: 'var(--muted)' }}>📡 {sources}</span>
        </div>

        {/* Métriques financières */}
        {(pvNette !== undefined || bien.loyer_estime) && (
          <div className="grid grid-cols-2 gap-2 pt-2"
               style={{ borderTop: '1px solid var(--border)' }}>
            {pvNette !== undefined && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Plus-value nette</p>
                <p className="text-sm font-semibold" style={{ color: pvNette > 0 ? '#22c55e' : '#ef4444' }}>
                  {pvNette > 0 ? '+' : ''}{(pvNette as number).toLocaleString('fr-BE')}€
                </p>
              </div>
            )}
            {bien.loyer_estime && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Loyer estimé</p>
                <p className="text-sm font-semibold text-white">{fmt(bien.loyer_estime)}/mois</p>
              </div>
            )}
          </div>
        )}

        {/* Signaux spéciaux */}
        {(jours && jours >= 180 || remise && remise > 0) ? (
          <div className="flex gap-2 flex-wrap">
            {jours && jours >= 180 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
                ⏳ {jours}j en ligne
              </span>
            )}
            {remise && remise > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
                🔄 Remise n°{remise}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  )
}
