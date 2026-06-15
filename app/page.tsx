'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Bien } from '@/lib/supabase'
import BienCard, { BienCardSkeleton } from '@/components/BienCard'
import BienModal from '@/components/BienModal'
import StatsBar from '@/components/StatsBar'
import Filters, { FilterState } from '@/components/Filters'

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 100,
        backgroundColor: '#1A1060', color: '#fff',
        borderRadius: 14, padding: '14px 20px',
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 8px 32px rgba(26,16,96,0.35)',
        display: 'flex', alignItems: 'center', gap: 10,
        maxWidth: 340,
      }}
    >
      <span style={{ fontSize: 18 }}>🏠</span>
      {msg}
    </motion.div>
  )
}

// ── Empty state avec countdown ────────────────────────────────────────────────
function EmptyState() {
  const [secs, setSecs] = useState(1800)

  useEffect(() => {
    const id = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 1800)), 1000)
    return () => clearInterval(id)
  }, [])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ textAlign: 'center', padding: '100px 0' }}
    >
      {/* Animated house */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{ fontSize: 64, marginBottom: 24, display: 'inline-block' }}
      >
        🏚
      </motion.div>
      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
        Aucun bien trouvé
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
        L&apos;agent surveille le marché toutes les 30 minutes
      </p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        backgroundColor: 'var(--card)', borderRadius: 12,
        padding: '12px 24px', boxShadow: '0 2px 16px rgba(26,16,96,0.07)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          style={{ width: 16, height: 16, border: '2px solid var(--purple)', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
          Prochain scan dans&nbsp;
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--purple)', fontVariantNumeric: 'tabular-nums' }}>
          {mm}:{ss}
        </span>
      </div>
    </motion.div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [biens, setBiens]       = useState<Bien[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Bien | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const prevCount               = useRef(0)
  const [filters, setFilters]   = useState<FilterState>({
    recommandation: 'tous',
    commune: '',
    prixMax: 120000,
    scoreMin: 0,
  })

  const fetchBiens = useCallback(async () => {
    let q = supabase
      .from('biens')
      .select('*')
      .in('statut', ['notifie', 'analyse', 'nouveau'])
      .order('date_detection', { ascending: false })
      .limit(300)

    if (filters.recommandation !== 'tous')
      q = q.eq('recommandation', filters.recommandation)
    if (filters.commune)
      q = q.ilike('ville', `%${filters.commune}%`)
    if (filters.prixMax < 120000)
      q = q.lte('prix', filters.prixMax)
    if (filters.scoreMin > 0)
      q = q.gte('score_ia', filters.scoreMin)

    const { data, error } = await q
    if (!error && data) {
      const newBiens = data as Bien[]
      if (prevCount.current > 0 && newBiens.length > prevCount.current) {
        const diff = newBiens.length - prevCount.current
        setToast(`${diff} nouveau${diff > 1 ? 'x' : ''} bien${diff > 1 ? 's' : ''} détecté${diff > 1 ? 's' : ''} !`)
      }
      prevCount.current = newBiens.length
      setBiens(newBiens)
      setLastUpdate(new Date())
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchBiens()
    const channel = supabase
      .channel('biens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biens' }, () => fetchBiens())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchBiens])

  const stats = {
    total:    biens.length,
    acheter:  biens.filter(b => b.recommandation === 'ACHETER').length,
    negocier: biens.filter(b => b.recommandation === 'NEGOCIER').length,
    passer:   biens.filter(b => b.recommandation === 'PASSER' || b.recommandation === 'EVITER').length,
    analyses: biens.filter(b => b.score_ia && b.score_ia > 0).length,
  }

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: 'rgba(240,240,250,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6B4EFF 0%, #9B7EFF 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>I</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                IMMO PRO
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, letterSpacing: '0.03em' }}>
                Wallonie complète · max 120 000€
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {lastUpdate && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Màj {fmtTime(lastUpdate)}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1A7A4A' }}
              />
              <span style={{ fontSize: 11, color: '#1A7A4A', fontWeight: 700, letterSpacing: '0.05em' }}>
                TEMPS RÉEL
              </span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 28px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <StatsBar stats={stats} />
        <Filters filters={filters} onChange={setFilters} />

        {/* Grille */}
        {loading ? (
          <div>
            <div style={{ height: 20, marginBottom: 16 }} />
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {Array.from({ length: 9 }).map((_, i) => <BienCardSkeleton key={i} />)}
            </div>
          </div>
        ) : biens.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {biens.map((b, i) => (
                <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {selected && <BienModal bien={selected} onClose={() => setSelected(null)} />}

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} msg={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}
