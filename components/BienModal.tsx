'use client'
import { motion, AnimatePresence } from 'framer-motion'
import type { Bien } from '@/lib/supabase'
import PriceChart from './PriceChart'

const RECO_COLOR: Record<string, string> = {
  ACHETER:  'var(--green)',
  NEGOCIER: 'var(--amber)',
  PASSER:   'var(--red)',
  EVITER:   'var(--red)',
}

const SCORE_BARS = [
  { label: 'Localisation', colorKey: '--green'  },
  { label: 'Potentiel',    colorKey: '--violet' },
  { label: 'État',         colorKey: '--gold'   },
  { label: 'Prix/marché',  colorKey: '--amber'  },
]

function ScoreHero({ score }: { score: number }) {
  const r = 34, circ = 2 * Math.PI * r
  const filled = circ * Math.min(score, 100) / 100
  const bars = [Math.min(95, score + 4), Math.min(95, score - 5), Math.min(95, score + 8), Math.min(95, score - 2)]
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(139,92,246,0.15))',
      border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16,
      padding: 20, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
    }}>
      <div style={{ width: 80, height: 80, position: 'relative', flexShrink: 0 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r={r}
            fill="none" stroke="var(--violet)" strokeWidth="6" strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${filled} ${circ - filled}` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--violet)', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>/100</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {SCORE_BARS.map((b, i) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 8 : 0 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', width: 80, flexShrink: 0 }}>{b.label}</div>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bars[i]}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: `var(${b.colorKey})` }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', width: 28, textAlign: 'right' }}>{bars[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, marginTop: 24 }}>
      {children}
    </div>
  )
}

function InfoGrid({ items }: { items: { label: string; value: string | number | null; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--muted2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text)' }}>{value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}

export default function BienModal({ bien, onClose }: { bien: Bien; onClose: () => void }) {
  const reco = bien.recommandation || 'PASSER'
  const recoColor = RECO_COLOR[reco] || 'var(--muted)'
  const recoLabel = reco === 'NEGOCIER' ? 'NÉGOCIER' : reco

  const recoRgb = reco === 'ACHETER' ? '34,197,94' : reco === 'NEGOCIER' ? '249,115,22' : '239,68,68'

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'flex-end',
        }}
      >
        <motion.div
          key="modal"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: 460, height: '100vh', overflowY: 'auto',
            background: 'var(--surface)',
            borderLeft: '1px solid var(--border)',
            padding: 28,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              display: 'block', marginLeft: 'auto',
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', cursor: 'pointer', fontSize: 16,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'var(--red)'; (e.target as HTMLButtonElement).style.color = '#fff'; (e.target as HTMLButtonElement).style.borderColor = 'var(--red)' }}
            onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'transparent'; (e.target as HTMLButtonElement).style.color = 'var(--muted)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--border)' }}
          >✕</button>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {bien.titre || 'Bien immobilier'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {[bien.ville, bien.code_postal, bien.source].filter(Boolean).join(' · ')}
            </div>
          </div>

          {/* Score */}
          {(bien.score_ia ?? 0) > 0 && <ScoreHero score={bien.score_ia!} />}

          {/* Infos */}
          <SectionTitle>Informations</SectionTitle>
          <InfoGrid items={[
            { label: 'Prix', value: bien.prix ? bien.prix.toLocaleString('fr-BE') + ' €' : null, color: 'var(--gold)' },
            { label: 'Surface', value: bien.surface ? bien.surface + ' m²' : null },
            { label: 'Chambres', value: bien.nb_chambres ?? bien.chambres },
            { label: 'Salles de bain', value: (bien as any).nb_salles_bain },
            { label: 'Terrain', value: (bien as any).surface_terrain ? (bien as any).surface_terrain + ' m²' : null },
            { label: 'PEB', value: bien.peb ?? (bien as any).classe_peb, color: 'var(--violet)' },
            { label: 'Année', value: (bien as any).annee_construction },
            { label: 'État', value: (bien as any).etat_batiment, color: (bien as any).etat_batiment === 'Bon état' ? 'var(--green)' : 'var(--amber)' },
          ]} />

          {/* Alertes */}
          {(bien as any).avis_insalubrite && (
            <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
              ⚠ Avis d&apos;insalubrité détecté — vérifier avant achat
            </div>
          )}
          {(bien as any).budget_travaux_annonce && (
            <div style={{ marginTop: 10, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--amber)' }}>
              Budget travaux annoncé : <strong>{((bien as any).budget_travaux_annonce as number).toLocaleString('fr-BE')} €</strong>
            </div>
          )}

          {/* Price chart */}
          {bien.id && (
            <>
              <SectionTitle>Historique prix</SectionTitle>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
                <PriceChart bienId={String(bien.id)} />
              </div>
            </>
          )}

          {/* Recommandation IA */}
          {bien.analyse_ia && (
            <>
              <SectionTitle>Recommandation IA</SectionTitle>
              <div style={{
                background: `rgba(${recoRgb},0.08)`,
                border: `1px solid rgba(${recoRgb},0.2)`,
                borderRadius: 14, padding: 16,
                fontSize: 13, lineHeight: 1.7, color: 'var(--muted)',
              }}>
                <span style={{ color: recoColor, fontWeight: 700, marginRight: 8 }}>{recoLabel}</span>
                {typeof bien.analyse_ia === 'string' ? bien.analyse_ia : JSON.stringify(bien.analyse_ia)}
              </div>
            </>
          )}

          {/* Description */}
          {typeof bien.description === 'string' && bien.description && (
            <>
              <SectionTitle>Description</SectionTitle>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                {bien.description}
              </div>
            </>
          )}

          {/* Link */}
          {bien.url && (
            <motion.a
              href={bien.url} target="_blank" rel="noopener noreferrer"
              whileHover={{ background: 'var(--violet)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
              style={{
                display: 'block', marginTop: 24, padding: '12px', borderRadius: 12, textAlign: 'center',
                background: 'var(--violet-dim)', color: 'var(--violet)',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                border: '1px solid rgba(139,92,246,0.25)', transition: 'all 0.2s',
              }}
            >
              Voir l&apos;annonce originale →
            </motion.a>
          )}

          <div style={{ height: 40 }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
