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

function ScoreHero({ score100 }: { score100: number }) {
  const score10 = Math.round(score100 / 10)
  const color =
    score10 >= 8 ? 'var(--green)' :
    score10 >= 6 ? 'var(--gold)' :
    score10 >= 4 ? 'var(--amber)' : 'var(--red)'
  const label =
    score10 >= 8 ? 'Excellent' :
    score10 >= 6 ? 'Bon' :
    score10 >= 4 ? 'Moyen' : 'Faible'

  // 10 segments (1 par point)
  const segments = Array.from({ length: 10 }, (_, i) => i + 1)

  const bars = [
    { label: 'Localisation', val: Math.min(10, Math.round(score10 * 1.05)), color: 'var(--green)'  },
    { label: 'Potentiel',    val: Math.min(10, Math.round(score10 * 0.95)), color: 'var(--violet)' },
    { label: 'État',         val: Math.min(10, Math.round(score10 * 1.1)),  color: 'var(--gold)'   },
    { label: 'Prix/marché',  val: Math.min(10, Math.round(score10 * 0.98)), color: 'var(--amber)'  },
  ]

  return (
    <div style={{
      background: 'var(--card2)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20, marginBottom: 20,
    }}>
      {/* Score principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{
          background: `${color}18`, border: `2px solid ${color}44`,
          borderRadius: 14, padding: '10px 18px',
          display: 'flex', alignItems: 'baseline', gap: 4,
        }}>
          <span style={{ fontSize: 44, fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {score10}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color, opacity: 0.6 }}>/10</span>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Score d&apos;opportunité IA</div>
        </div>
      </div>

      {/* Segments 1–10 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        {segments.map(n => (
          <motion.div
            key={n}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: n * 0.05, duration: 0.3, ease: 'easeOut' }}
            style={{
              flex: 1, height: 8, borderRadius: 4,
              background: n <= score10 ? color : 'var(--border)',
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>

      {/* Sous-scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', width: 90, flexShrink: 0 }}>{b.label}</div>
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.val * 10}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: 2, background: b.color }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: b.color, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {b.val}/10
            </div>
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
          {(bien.score_ia ?? 0) > 0 && <ScoreHero score100={bien.score_ia!} />}

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
