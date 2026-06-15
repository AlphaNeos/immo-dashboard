'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
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
      padding: '11px 0', borderBottom: '1px solid var(--border-soft)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent || 'var(--text)' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: '0 18px' }}>
      {children}
    </div>
  )
}

const RECO_COLOR: Record<string, string> = { ACHETER: '#1A7A4A', NEGOCIER: '#E07B39', PASSER: '#C1121F', EVITER: '#C1121F' }
const RECO_LABEL: Record<string, string> = { ACHETER: 'ACHETER', NEGOCIER: 'NEGOCIER', PASSER: 'PASSER', EVITER: 'PASSER' }

export default function BienModal({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = '' }
  }, [onClose])

  const a: any = bien.analyse_ia || {}
  const ar: any = a.achat_revente || {}
  const reco = bien.recommandation || ''
  const recoColor = RECO_COLOR[reco] || 'var(--muted)'
  const score = bien.score_ia ?? 0
  const scoreColor = score >= 8 ? '#1A7A4A' : score >= 5 ? '#E07B39' : score > 0 ? '#C1121F' : 'var(--muted)'

  const forts:  string[] = a.points_forts        || []
  const attent: string[] = a.points_attention     || []
  const opport: string[] = a.opportunites_cachees || []
  const primes:     string = a.primes_wallonie    || ''
  const etatBien:   string = a.etat_bien          || ''
  const locScore: number | undefined = a.localisation_score
  const locAnalyse: string = a.localisation_analyse || ''
  const grandeVille: string = a.grande_ville_proche || ''

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', backgroundColor: 'rgba(26,16,96,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{ width: '100%', maxWidth: 660, height: '100%', overflowY: 'auto', backgroundColor: '#FFFFFF', boxShadow: '-20px 0 80px rgba(26,16,96,0.15)', borderLeft: '1px solid var(--border-soft)' }}
      >
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-soft)', padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0, letterSpacing: '-0.01em' }}>{bien.titre || 'Bien immobilier'}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>{bien.ville || bien.adresse || 'Localisation inconnue'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {reco && (
              <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 100, backgroundColor: recoColor, color: '#fff', letterSpacing: '0.06em' }}>
                {RECO_LABEL[reco] || reco}
              </span>
            )}
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid var(--border-soft)', backgroundColor: 'var(--bg)', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              x
            </button>
          </div>
        </div>

        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Score */}
          {score > 0 && (
            <div style={{ background: 'linear-gradient(135deg, #6B4EFF08, #6B4EFF14)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ fontSize: 52, fontWeight: 800, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {score}<span style={{ fontSize: 20, color: 'var(--muted)', fontWeight: 500 }}>/10</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div key={i} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < score ? scoreColor : 'var(--border-soft)', transformOrigin: 'left' }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Score IA · {RECO_LABEL[reco] || 'Non analysé'}
                </p>
              </div>
            </div>
          )}

          {/* Résumé */}
          {(a.resume_telegram || a.justification) && (
            <div style={{ background: 'linear-gradient(135deg, #6B4EFF08, #6B4EFF14)', border: '1px solid var(--border)', borderLeft: '3px solid var(--purple)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>
              {a.resume_telegram || a.justification}
            </div>
          )}

          {/* Infos */}
          <Section title="Informations">
            <Card>
              <Row label="Prix affiché"    value={fmt(bien.prix)} />
              {bien.prix_precedent && <Row label="Prix precedent" value={fmt(bien.prix_precedent)} accent="#E07B39" />}
              {bien.surface    && <Row label="Surface"        value={bien.surface + ' m²'} />}
              {(bien.chambres ?? bien.nb_chambres) && <Row label="Chambres" value={String(bien.chambres ?? bien.nb_chambres)} />}
              {bien.terrain    && <Row label="Terrain"        value={bien.terrain + ' m²'} />}
              {bien.peb        && <Row label="PEB"            value={bien.peb.toUpperCase()} />}
              {bien.jours_en_ligne != null && <Row label="Jours en ligne" value={bien.jours_en_ligne + ' jours'} accent={bien.jours_en_ligne >= 60 ? '#E07B39' : undefined} />}
              {bien.source     && <Row label="Source"        value={bien.source} />}
              {bien.date_detection && <Row label="Detecte le" value={new Date(bien.date_detection).toLocaleDateString('fr-BE')} />}
            </Card>
          </Section>

          {(locScore != null || locAnalyse || grandeVille) && (
            <Section title="Localisation">
              <Card>
                {locScore != null && <Row label="Score localisation" value={locScore + '/10'} />}
                {grandeVille && <Row label="Grande ville proche" value={grandeVille} />}
                {locAnalyse && <div style={{ padding: '11px 0', borderBottom: '1px solid var(--border-soft)' }}><p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{locAnalyse}</p></div>}
              </Card>
            </Section>
          )}

          {etatBien && (
            <Section title="Etat du bien">
              <Card>
                <div style={{ padding: '11px 0' }}><p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{etatBien}</p></div>
              </Card>
            </Section>
          )}

          {primes && (
            <Section title="Primes wallonnes 2025">
              <div style={{ background: 'rgba(26,122,74,0.07)', border: '1px solid rgba(26,122,74,0.2)', borderLeft: '3px solid #1A7A4A', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--text)', lineHeight: 1.65 }}>
                {primes}
              </div>
            </Section>
          )}

          {(a.budget_travaux || a.budget_travaux_brut || ar.plus_value_nette != null) && (
            <Section title="Analyse financiere">
              <Card>
                {a.budget_travaux_brut != null && <Row label="Travaux brut"         value={fmt(a.budget_travaux_brut)} />}
                {a.budget_travaux_net  != null && <Row label="Travaux net (primes)" value={fmt(a.budget_travaux_net)} accent="#1A7A4A" />}
                {a.budget_travaux != null && !a.budget_travaux_brut && <Row label="Budget travaux" value={fmt(a.budget_travaux)} />}
                {a.cout_total         != null && <Row label="Cout total projet"     value={fmt(a.cout_total)} />}
                {a.valeur_apres_renov != null && <Row label="Valeur apres reno"     value={fmt(a.valeur_apres_renov)} accent="#1A7A4A" />}
              </Card>
              {ar.plus_value_nette != null && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Achat-Revente (flip)</p>
                  <Card>
                    {ar.prix_achat              != null && <Row label="Prix achat"                      value={fmt(ar.prix_achat)} />}
                    {ar.droits_enregistrement   != null && <Row label="+ Droits enregistrement (12.5%)" value={fmt(ar.droits_enregistrement)} />}
                    {ar.frais_notaire_achat     != null && <Row label="+ Frais notaire achat"           value={fmt(ar.frais_notaire_achat)} />}
                    {ar.recuperation_3_5_droits != null && <Row label="- Recuperation 3/5 (art.212)"   value={'-' + ar.recuperation_3_5_droits.toLocaleString('fr-BE') + ' EUR'} accent="#1A7A4A" />}
                    {ar.travaux                 != null && <Row label="+ Travaux"                       value={fmt(ar.travaux)} />}
                    {ar.cout_total_reel         != null && <Row label="= Cout total reel"               value={fmt(ar.cout_total_reel)} />}
                    {ar.prix_revente            != null && <Row label="Prix revente estime"             value={fmt(ar.prix_revente)} />}
                    {ar.taxe_speculation_16_5   != null && <Row label="- Taxe speculation (16.5%)"     value={'-' + ar.taxe_speculation_16_5.toLocaleString('fr-BE') + ' EUR'} accent="#C1121F" />}
                    {ar.plus_value_nette        != null && <Row label="Plus-value NETTE"               value={fmt(ar.plus_value_nette)} accent={ar.plus_value_nette > 0 ? '#1A7A4A' : '#C1121F'} />}
                  </Card>
                </div>
              )}
            </Section>
          )}

          {(a.loyer_estime || a.rendement_brut) && (
            <Section title="Rentabilite locative">
              <Card>
                {a.loyer_estime     != null && <Row label="Loyer estime"      value={fmt(a.loyer_estime, ' EUR/mois')} />}
                {a.rendement_brut   != null && <Row label="Rendement brut"    value={(a.rendement_brut as number).toFixed(1) + ' %'} />}
                {a.rendement_net    != null && <Row label="Rendement net"     value={(a.rendement_net as number).toFixed(1) + ' %'} />}
                {a.cashflow_mensuel != null && <Row label="Cash-flow mensuel" value={fmt(a.cashflow_mensuel, ' EUR')} accent={(a.cashflow_mensuel as number) > 0 ? '#1A7A4A' : '#C1121F'} />}
              </Card>
            </Section>
          )}

          {(forts.length > 0 || attent.length > 0 || opport.length > 0) && (
            <Section title="Analyse qualitative">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {forts.length > 0 && (
                  <div style={{ background: 'rgba(26,122,74,0.07)', border: '1px solid rgba(26,122,74,0.18)', borderLeft: '3px solid #1A7A4A', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Points forts</p>
                    {forts.map((f, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 5px', lineHeight: 1.5 }}>- {f}</p>)}
                  </div>
                )}
                {attent.length > 0 && (
                  <div style={{ background: 'rgba(224,123,57,0.07)', border: '1px solid rgba(224,123,57,0.18)', borderLeft: '3px solid #E07B39', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#E07B39', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Points attention</p>
                    {attent.map((f, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 5px', lineHeight: 1.5 }}>- {f}</p>)}
                  </div>
                )}
                {opport.length > 0 && (
                  <div style={{ background: 'rgba(107,78,255,0.07)', border: '1px solid rgba(107,78,255,0.18)', borderLeft: '3px solid var(--purple)', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Opportunites cachees</p>
                    {opport.map((f, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 5px', lineHeight: 1.5 }}>- {f}</p>)}
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section title="Historique des prix">
            <PriceChart bienId={bien.id} />
          </Section>

          {bien.description && (
            <Section title="Description">
              <div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border-soft)', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                {bien.description}
              </div>
            </Section>
          )}

          {bien.url && (
            <motion.a href={bien.url} target="_blank" rel="noopener noreferrer"
              whileHover={{ backgroundColor: '#5A3DEE' }}
              style={{ display: 'block', textAlign: 'center', fontWeight: 800, fontSize: 13, padding: '15px', borderRadius: 12, textDecoration: 'none', backgroundColor: 'var(--purple)', color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'background-color 0.2s' }}
            >
              Voir l'annonce
            </motion.a>
          )}
        </div>
      </motion.div>
    </div>
  )
}
