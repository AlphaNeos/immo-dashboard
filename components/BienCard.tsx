'use client'
import { motion } from 'framer-motion'
import type { Bien } from '@/lib/supabase'

const RECO_COLOR: Record<string, string> = {
  ACHETER:  'var(--green)',
  NEGOCIER: 'var(--amber)',
  PASSER:   'var(--red)',
  EVITER:   'var(--red)',
}
const RECO_BG: Record<string, string> = {
  ACHETER:  'rgba(34,197,94,0.15)',
  NEGOCIER: 'rgba(249,115,22,0.15)',
  PASSER:   'rgba(239,68,68,0.15)',
  EVITER:   'rgba(239,68,68,0.15)',
}
const RECO_LABEL: Record<string, string> = {
  ACHETER:  'ACHETER',
  NEGOCIER: 'NÉGOCIER',
  PASSER:   'PASSER',
  EVITER:   'ÉVITER',
}

function ScoreRing({ score }: { score: number }) {
  const r = 20, circ = 2 * Math.PI * r
  const filled = circ * Math.min(score, 100) / 100
  return (
    <div style={{ width: 52, height: 52, position: 'relative', flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="4" />
        <motion.circle
          cx="26" cy="26" r={r}
          fill="none" stroke="var(--violet)" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ - filled}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${filled} ${circ - filled}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontSize: 12, fontWeight: 800, color: 'var(--violet)',
      }}>{score}</div>
    </div>
  )
}

export function BienCardSkeleton() {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ height: 4, background: 'var(--border)' }} />
      <div style={{ height: 160, background: 'var(--card2)' }} className="skeleton" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 22, width: '60%' }} />
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 56 }} />
          <div className="skeleton" style={{ height: 28, width: 56 }} />
        </div>
        <div className="skeleton" style={{ height: 36 }} />
      </div>
    </div>
  )
}

export default function BienCard({ bien, onClick, index }: { bien: Bien; onClick: () => void; index: number }) {
  const reco = bien.recommandation || 'PASSER'
  const accentColor = RECO_COLOR[reco] || 'var(--muted2)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35, ease: 'easeOut' }}
      whileHover={{
        y: -4,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.3)',
        borderColor: 'rgba(139,92,246,0.4)',
      }}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
      }} />

      {/* Photo zone */}
      <div style={{ height: 160, background: 'var(--card2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>

        {/* Reco badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: RECO_BG[reco] || 'rgba(100,116,139,0.15)',
          border: `1px solid ${accentColor}44`,
          color: accentColor,
          borderRadius: 8, padding: '4px 10px',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        }}>
          {RECO_LABEL[reco] || reco}
        </div>

        {/* Photo count */}
        {(bien.nb_photos ?? 0) > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 8, padding: '4px 9px',
            fontSize: 11, fontWeight: 600, color: '#fff',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            {bien.nb_photos}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {bien.prix ? bien.prix.toLocaleString('fr-BE') + ' €' : '— €'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bien.titre || 'Sans titre'}
            </div>
          </div>
          {(bien.score_ia ?? 0) > 0 && <ScoreRing score={bien.score_ia!} />}
        </div>

        {/* Localisation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            {[bien.ville, bien.code_postal].filter(Boolean).join(' · ') || 'Localisation inconnue'}
          </div>
        </div>

        {/* Specs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {bien.nb_chambres && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'flex', gap: 4 }}>
              <span style={{ color: 'var(--text)' }}>{bien.nb_chambres}</span> ch.
            </div>
          )}
          {bien.surface && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'flex', gap: 4 }}>
              <span style={{ color: 'var(--text)' }}>{bien.surface}</span> m²
            </div>
          )}
          {bien.peb && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'flex', gap: 4 }}>
              PEB <span style={{ color: 'var(--violet)' }}>{bien.peb}</span>
            </div>
          )}
          {bien.source && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 10, fontWeight: 600, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {bien.source}
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          whileHover={{ background: 'var(--violet)', color: '#fff', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
          style={{
            padding: '10px', borderRadius: 12, textAlign: 'center',
            background: 'var(--violet-dim)', color: 'var(--violet)',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
            border: '1px solid rgba(139,92,246,0.2)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Voir l&apos;analyse →
        </motion.div>
      </div>
    </motion.div>
  )
}
