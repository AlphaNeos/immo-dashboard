'use client'

import { useEffect } from 'react'
import { type Bien } from '@/lib/supabase'
import PriceChart from './PriceChart'

function fmt(n: number | null | undefined, suffix = ' €') {
  if (n == null) return '—'
  return n.toLocaleString('fr-BE') + suffix
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: accent || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2 style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
        color: 'var(--muted)', margin: 0,
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '0 16px',
    }}>
      {children}
    </div>
  )
}

const RECO_COLOR: Record<string, string> = {
  ACHETER: '#22C55E', NEGOCIER: '#F59E0B', PASSER: '#EF4444', EVITER: '#EF4444',
}
const RECO_LABEL: Record<string, string> = {
  ACHETER: 'ACHETER', NEGOCIER: 'NÉGOCIER', PASSER: 'PASSER', EVITER: 'PASSER',
}

export default function BienModal({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a: any = bien.analyse_ia || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ar: any = a.achat_revente || {}
  const reco = bien.recommandation || ''
  const recoColor = RECO_COLOR[reco] || 'var(--muted)'
  const score = bien.score_ia ?? 0
  const scoreColor = score >= 8 ? '#22C55E' : score >= 5 ? '#F59E0B' : score > 0 ? '#EF4444' : 'var(--muted)'

  const forts:   string[] = a.points_forts         || []
  const attent:  string[] = a.points_attention      || []
  const opport:  string[] = a.opportunites_cachees  || []

  const primes: string = a.primes_wallonie || ''
  const etatBien: string = a.etat_bien || ''
  const locScore: number | undefined = a.localisation_score
  const locAnalyse: string = a.localisation_analyse || ''
  const grandeVille: string = a.grande_ville_proche || ''

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.75)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 680, height: '100%',
        overflowY: 'auto', backgroundColor: 'var(--bg)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-24px 0 80px rgba(0,0,0,0.5)',
      }}>
        {/* Sticky header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          backgroundColor: 'rgba(13,15,20,0.92)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>
              {bien.titre || 'Bien immobilier'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
              {bien.ville || bien.adresse || '—'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {reco && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                backgroundColor: `${recoColor}18`, color: recoColor,
                border: `1px solid ${recoColor}30`,
              }}>
                {RECO_LABEL[reco] || reco}
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)', color: 'var(--muted)',
                cursor: 'pointer', fontSize: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Score IA */}
          {score > 0 && (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Score IA
                </span>
                <span style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: '-0.02em' }}>
                  {score}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/10</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{
                    flex: 1, height: 6, borderRadius: 3,
                    backgroundColor: i < score ? scoreColor : 'var(--border)',
                    transition: 'background-color 0.2s',
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Résumé IA */}
          {(a.resume_telegram || a.justification) && (
            <div style={{
              backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10, padding: '12px 16px',
              fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.6,
            }}>
              {a.resume_telegram || a.justification}
            </div>
          )}

          {/* Infos générales */}
          <Section title="Informations">
            <Card>
              <Row label="Prix affiché"    value={fmt(bien.prix)} />
              {bien.prix_precedent && (
                <Row label="Prix précédent" value={fmt(bien.prix_precedent)} accent="#F59E0B" />
              )}
              {bien.surface    && <Row label="Surface"         value={`${bien.surface} m²`} />}
              {(bien.chambres ?? bien.nb_chambres) && (
                <Row label="Chambres"        value={`${bien.chambres ?? bien.nb_chambres}`} />
              )}
              {bien.terrain    && <Row label="Terrain"         value={`${bien.terrain} m²`} />}
              {bien.peb        && <Row label="PEB"             value={bien.peb.toUpperCase()} />}
              {bien.jours_en_ligne != null && (
                <Row label="Jours en ligne"  value={`${bien.jours_en_ligne} jours`}
                     accent={bien.jours_en_ligne >= 60 ? '#F59E0B' : undefined} />
              )}
              {bien.source     && <Row label="Source"         value={bien.source} />}
              {bien.date_detection && (
                <Row label="Détecté le"      value={new Date(bien.date_detection).toLocaleDateString('fr-BE')} />
              )}
            </Card>
          </Section>

          {/* Localisation */}
          {(locScore != null || locAnalyse || grandeVille) && (
            <Section title="Localisation">
              <Card>
                {locScore != null && <Row label="Score localisation" value={`${locScore}/10`} />}
                {grandeVille && <Row label="Grande ville proche" value={grandeVille} />}
                {locAnalyse && (
                  <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.5 }}>{locAnalyse}</p>
                  </div>
                )}
              </Card>
            </Section>
          )}

          {/* État du bien */}
          {etatBien && (
            <Section title="État du bien">
              <Card>
                <div style={{ padding: '10px 0' }}>
                  <p style={{ fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.5 }}>{etatBien}</p>
                </div>
              </Card>
            </Section>
          )}

          {/* Primes wallonnes */}
          {primes && (
            <Section title="Primes wallonnes">
              <div style={{
                backgroundColor: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 10, padding: '12px 16px',
                fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.6,
              }}>
                {primes}
              </div>
            </Section>
          )}

          {/* Analyse financière */}
          {(a.budget_travaux || ar.plus_value_nette != null) && (
            <Section title="Analyse financière">
              <Card>
                {a.budget_travaux_brut != null && (
                  <Row label="Travaux brut" value={fmt(a.budget_travaux_brut)} />
                )}
                {a.budget_travaux_net != null && (
                  <Row label="Travaux net (primes)" value={fmt(a.budget_travaux_net)} accent="#22C55E" />
                )}
                {a.budget_travaux != null && !a.budget_travaux_brut && (
                  <Row label="Budget travaux" value={fmt(a.budget_travaux)} />
                )}
                {a.cout_total != null && <Row label="Coût total projet"   value={fmt(a.cout_total)} />}
                {a.valeur_apres_renov != null && (
                  <Row label="Valeur après réno" value={fmt(a.valeur_apres_renov)} accent="#22C55E" />
                )}
              </Card>

              {ar.plus_value_nette != null && (
                <>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '8px 0 0' }}>
                    Achat–Revente (flip)
                  </h3>
                  <Card>
                    {ar.prix_achat              != null && <Row label="Prix achat"                     value={fmt(ar.prix_achat)} />}
                    {ar.droits_enregistrement   != null && <Row label="+ Droits enregistrement (12,5%)" value={fmt(ar.droits_enregistrement)} />}
                    {ar.frais_notaire_achat     != null && <Row label="+ Frais notaire achat"           value={fmt(ar.frais_notaire_achat)} />}
                    {ar.recuperation_3_5_droits != null && (
                      <Row label="− Récupération 3/5 (art. 212)"  value={`-${ar.recuperation_3_5_droits.toLocaleString('fr-BE')} €`} accent="#22C55E" />
                    )}
                    {ar.travaux                 != null && <Row label="+ Travaux"                       value={fmt(ar.travaux)} />}
                    {ar.cout_total_reel         != null && <Row label="= Coût total réel"               value={fmt(ar.cout_total_reel)} />}
                    {ar.prix_revente            != null && <Row label="Prix revente estimé"             value={fmt(ar.prix_revente)} />}
                    {ar.taxe_speculation_16_5   != null && (
                      <Row label="− Taxe spéculation (16,5%)"     value={`-${ar.taxe_speculation_16_5.toLocaleString('fr-BE')} €`} accent="#EF4444" />
                    )}
                    {ar.plus_value_nette != null && (
                      <Row label="Plus-value NETTE"
                           value={fmt(ar.plus_value_nette)}
                           accent={ar.plus_value_nette > 0 ? '#22C55E' : '#EF4444'} />
                    )}
                  </Card>
                </>
              )}
            </Section>
          )}

          {/* Rentabilité locative */}
          {(a.loyer_estime || a.rendement_brut) && (
            <Section title="Rentabilité locative">
              <Card>
                {a.loyer_estime    != null && <Row label="Loyer estimé"      value={fmt(a.loyer_estime, ' €/mois')} />}
                {a.rendement_brut  != null && <Row label="Rendement brut"    value={`${(a.rendement_brut as number).toFixed(1)} %`} />}
                {a.rendement_net   != null && <Row label="Rendement net"     value={`${(a.rendement_net as number).toFixed(1)} %`} />}
                {a.cashflow_mensuel != null && (
                  <Row label="Cash-flow mensuel" value={fmt(a.cashflow_mensuel, ' €')}
                       accent={(a.cashflow_mensuel as number) > 0 ? '#22C55E' : '#EF4444'} />
                )}
              </Card>
            </Section>
          )}

          {/* Points forts / attention / opportunités */}
          {(forts.length > 0 || attent.length > 0 || opport.length > 0) && (
            <Section title="Analyse qualitative">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {forts.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Points forts
                    </p>
                    {forts.map((f, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 4px', lineHeight: 1.5 }}>· {f}</p>
                    ))}
                  </div>
                )}
                {attent.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Points d&apos;attention
                    </p>
                    {attent.map((f, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 4px', lineHeight: 1.5 }}>· {f}</p>
                    ))}
                  </div>
                )}
                {opport.length > 0 && (
                  <div style={{ backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Opportunités cachées
                    </p>
                    {opport.map((f, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--muted-2)', margin: '0 0 4px', lineHeight: 1.5 }}>· {f}</p>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Historique prix */}
          <Section title="Historique des prix">
            <PriceChart bienId={bien.id} />
          </Section>

          {/* Description */}
          {bien.description && (
            <Section title="Description">
              <div style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px',
                fontSize: 13, color: 'var(--muted-2)', lineHeight: 1.65,
              }}>
                {bien.description}
              </div>
            </Section>
          )}

          {/* CTA */}
          {bien.url && (
            <a
              href={bien.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', fontWeight: 700, fontSize: 14,
                padding: '14px', borderRadius: 12, textDecoration: 'none',
                backgroundColor: 'var(--indigo)', color: '#fff',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              Voir l&apos;annonce →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
