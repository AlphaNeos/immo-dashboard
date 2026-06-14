'use client'

import { useEffect } from 'react'
import { Bien } from '@/lib/supabase'
import PriceChart from './PriceChart'

function fmt(n: number | null | undefined, suffix = '€') {
  if (n == null) return '—'
  return n.toLocaleString('fr-BE') + suffix
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: accent || 'var(--text)' }}>{value}</span>
    </div>
  )
}

const RECO_COLOR: Record<string, string> = { ACHETER: '#22c55e', NEGOCIER: '#eab308', EVITER: '#ef4444' }

export default function BienModal({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any   = bien.analyse_ia || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ar: any  = a.achat_revente || {}
  const reco     = bien.recommandation || ''
  const recoColor = RECO_COLOR[reco] || '#64748b'
  const scoreIA   = bien.score_ia || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const travaux: Record<string, number> = a.detail_travaux || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const comps:   any[] = a.comparables   || []
  const forts:   string[] = a.points_forts   || []
  const attent:  string[] = a.points_attention || []
  const opport:  string[] = a.opportunites_cachees || []
  const pourquoi: string[] = a.pourquoi_interessant || []
  const resume:  string = a.resume_telegram || ''
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loyers_reels: any = (bien as any)._loyers_reels

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end"
         style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
         onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-2xl h-full overflow-y-auto shadow-2xl"
           style={{ backgroundColor: 'var(--bg)', borderLeft: '1px solid var(--border)' }}>

        {/* Header */}
        <div style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
             className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-tight">{bien.titre || 'Maison'}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              📍 {bien.adresse || bien.ville || '—'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {reco && (
              <span className="text-sm font-bold px-3 py-1 rounded-lg"
                    style={{ backgroundColor: `${recoColor}20`, color: recoColor }}>
                {reco}
              </span>
            )}
            <button onClick={onClose}
                    style={{ color: 'var(--muted)', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:text-white transition-colors text-lg">
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Résumé IA */}
          {resume && (
            <div style={{ backgroundColor: '#3b82f615', border: '1px solid #3b82f630' }}
                 className="rounded-lg px-4 py-3 text-sm text-white">
              💡 {resume}
            </div>
          )}

          {/* Score */}
          {scoreIA > 0 && (
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                 className="rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-white">Score IA</p>
                <span className="text-2xl font-bold" style={{ color: recoColor }}>{scoreIA}/10</span>
              </div>
              <div className="flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex-1 rounded" style={{ height: 8,
                    backgroundColor: i < scoreIA ? recoColor : 'var(--border)' }} />
                ))}
              </div>
            </div>
          )}

          {/* Infos générales */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              Informations
            </h2>
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                 className="rounded-xl px-4">
              <Row label="Prix affiché"   value={fmt(bien.prix)} />
              {bien.prix !== bien.prix_initial && bien.prix_initial &&
                <Row label="Prix initial" value={fmt(bien.prix_initial)} />}
              <Row label="Surface"        value={fmt(bien.surface, ' m²')} />
              <Row label="Chambres"       value={`${bien.chambres ?? '—'}`} />
              <Row label="Source(s)"      value={(bien.sources_vues || [bien.source]).join(', ')} />
              {bien.jours_en_ligne && <Row label="Jours en ligne" value={`${bien.jours_en_ligne} jours`}
                accent={bien.jours_en_ligne >= 180 ? '#f59e0b' : undefined} />}
              {bien.nb_remises_en_vente && bien.nb_remises_en_vente > 0 ?
                <Row label="Remises en vente" value={`${bien.nb_remises_en_vente}×`} accent="#3b82f6" /> : null}
              {bien.date_publication && <Row label="Publiée le"   value={new Date(bien.date_publication).toLocaleDateString('fr-BE')} />}
              {bien.date_detection   && <Row label="Détectée le"  value={new Date(bien.date_detection).toLocaleDateString('fr-BE')} />}
            </div>
          </section>

          {/* Pourquoi intéressant */}
          {pourquoi.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Pourquoi intéressant
              </h2>
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                   className="rounded-xl p-4 space-y-2">
                {pourquoi.map((r, i) => (
                  <p key={i} className="text-sm text-white flex gap-2"><span className="text-white shrink-0">→</span>{r}</p>
                ))}
              </div>
            </section>
          )}

          {/* Financier */}
          {(a.prix_negociation || a.frais_acquisition) && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Analyse financière
              </h2>
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                   className="rounded-xl px-4">
                {a.prix_negociation && <Row label="Prix à négocier" value={fmt(a.prix_negociation as number)} accent="#f59e0b" />}
                {a.justification_negociation && (
                  <div className="py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Justification négociation</p>
                    <p className="text-sm text-white mt-1">{a.justification_negociation as string}</p>
                  </div>
                )}
                {a.frais_acquisition && <Row label="Frais acquisition" value={fmt(a.frais_acquisition as number)} />}
                {a.budget_travaux    && <Row label="Budget travaux"    value={fmt(a.budget_travaux as number)} />}
                {a.cout_total        && <Row label="Coût total projet" value={fmt(a.cout_total as number)} accent="#e2e8f0" />}
                {a.valeur_apres_renov && <Row label="Valeur après réno" value={fmt(a.valeur_apres_renov as number)} accent="#22c55e" />}
              </div>

              {/* Détail travaux */}
              {Object.keys(travaux).length > 0 && (
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                     className="rounded-xl px-4 mt-2">
                  {Object.entries(travaux)
                    .sort(([,a],[,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <Row key={k} label={k.replace(/_/g, ' ')} value={fmt(v as number)} />
                    ))}
                </div>
              )}
            </section>
          )}

          {/* Achat-Revente */}
          {ar.plus_value_nette !== undefined && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Achat–Revente (flip)
              </h2>
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                   className="rounded-xl px-4">
                {ar.prix_achat              && <Row label="Prix achat"                     value={fmt(ar.prix_achat)} />}
                {ar.droits_enregistrement   && <Row label="+ Droits enregistrement (12,5%)" value={fmt(ar.droits_enregistrement)} />}
                {ar.frais_notaire_achat     && <Row label="+ Frais notaire achat"           value={fmt(ar.frais_notaire_achat)} />}
                {ar.recuperation_3_5_droits && <Row label="− Récupération 3/5 (art. 212)"  value={`-${ar.recuperation_3_5_droits.toLocaleString('fr-BE')}€`} accent="#22c55e" />}
                {ar.frais_notaire_revente   && <Row label="+ Frais notaire revente"         value={fmt(ar.frais_notaire_revente)} />}
                {ar.travaux                 && <Row label="+ Travaux"                       value={fmt(ar.travaux)} />}
                {ar.cout_total_reel         && <Row label="= Coût total réel"               value={fmt(ar.cout_total_reel)} accent="#e2e8f0" />}
                <div className="py-2" />
                {ar.prix_revente            && <Row label="Prix revente estimé"             value={fmt(ar.prix_revente)} />}
                {ar.plus_value_brute        && <Row label="Plus-value brute"                value={fmt(ar.plus_value_brute)} />}
                {ar.taxe_speculation_16_5   && <Row label="− Taxe spéculation (16,5%)"     value={`-${ar.taxe_speculation_16_5.toLocaleString('fr-BE')}€`} accent="#ef4444" />}
                <Row label="Plus-value NETTE"
                     value={fmt(ar.plus_value_nette)}
                     accent={ar.plus_value_nette > 0 ? '#22c55e' : '#ef4444'} />
              </div>
            </section>
          )}

          {/* Rentabilité locative */}
          {(a.loyer_estime || a.rendement_brut) && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Rentabilité locative
              </h2>
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                   className="rounded-xl px-4">
                {loyers_reels?.loyer_moyen && (
                  <Row label="Loyer réel marché (Immoweb)" value={fmt(loyers_reels.loyer_moyen as number, '€/mois')} accent="#22c55e" />
                )}
                {a.loyer_estime      && <Row label="Loyer estimé"         value={fmt(a.loyer_estime as number, '€/mois')} />}
                {a.rendement_brut    && <Row label="Rendement brut"       value={`${(a.rendement_brut as number).toFixed(1)}%`} />}
                {a.rendement_net     && <Row label="Rendement net"        value={`${(a.rendement_net as number).toFixed(1)}%`} />}
                {a.cashflow_mensuel  && <Row label="Cash-flow mensuel"    value={fmt(a.cashflow_mensuel as number, '€')}
                                             accent={(a.cashflow_mensuel as number) > 0 ? '#22c55e' : '#ef4444'} />}
                {loyers_reels?.nb_annonces && (
                  <Row label="Nb annonces loyers Immoweb" value={`${loyers_reels.nb_annonces}`} />
                )}
              </div>
            </section>
          )}

          {/* Comparables */}
          {comps.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Comparables marché ({comps.length})
              </h2>
              <div className="space-y-2">
                {comps.map((c, i) => (
                  <div key={i} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                       className="rounded-lg p-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.adresse as string || c.ville as string || '—'}</p>
                      {c.notes && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{c.notes as string}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{fmt(c.prix as number)}</p>
                      {c.surface && <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.surface as number} m²</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Points forts / attention / opportunités */}
          {(forts.length > 0 || attent.length > 0 || opport.length > 0) && (
            <section className="grid grid-cols-1 gap-3">
              {forts.length > 0 && (
                <div style={{ backgroundColor: '#22c55e10', border: '1px solid #22c55e30' }}
                     className="rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-400 mb-2">✅ Points forts</p>
                  {forts.map((f, i) => <p key={i} className="text-sm text-white">· {f}</p>)}
                </div>
              )}
              {attent.length > 0 && (
                <div style={{ backgroundColor: '#eab30810', border: '1px solid #eab30830' }}
                     className="rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-400 mb-2">⚠️ Points attention</p>
                  {attent.map((f, i) => <p key={i} className="text-sm text-white">· {f}</p>)}
                </div>
              )}
              {opport.length > 0 && (
                <div style={{ backgroundColor: '#3b82f610', border: '1px solid #3b82f630' }}
                     className="rounded-xl p-4">
                  <p className="text-xs font-semibold text-white mb-2">🚀 Opportunités cachées</p>
                  {opport.map((f, i) => <p key={i} className="text-sm text-white">· {f}</p>)}
                </div>
              )}
            </section>
          )}

          {/* Historique prix */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
              Historique des prix
            </h2>
            <PriceChart bienId={bien.id} />
          </section>

          {/* Description */}
          {bien.description && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                Description
              </h2>
              <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                   className="rounded-xl p-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{bien.description}</p>
              </div>
            </section>
          )}

          {/* Lien annonce */}
          <a href={bien.url} target="_blank" rel="noopener noreferrer"
             className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
             style={{ backgroundColor: '#3b82f6' }}>
            Voir l&apos;annonce →
          </a>
        </div>
      </div>
    </div>
  )
}
