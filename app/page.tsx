'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Bien } from '@/lib/supabase'
import BienCard, { BienCardSkeleton } from '@/components/BienCard'
import BienModal from '@/components/BienModal'
import StatsBar from '@/components/StatsBar'
import Filters, { FilterState } from '@/components/Filters'

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t) }, [onDone])
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 200,
        background: 'var(--violet)', color: '#fff',
        borderRadius: 14, padding: '14px 20px',
        fontSize: 13, fontWeight: 600,
        boxShadow: '0 8px 32px rgba(139,92,246,0.4)',
        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      {msg}
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  const [secs, setSecs] = useState(1800)
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s > 0 ? s - 1 : 1800), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '100px 0' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{ marginBottom: 24, display: 'inline-block' }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </motion.div>
      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Aucun bien trouvé</p>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>L&apos;agent surveille le marché toutes les 30 minutes</p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: 'var(--card)', borderRadius: 12,
        padding: '12px 24px', border: '1px solid var(--border)',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
          style={{ width: 16, height: 16, border: '2px solid var(--violet)', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Prochain scan dans&nbsp;</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--violet)', fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [biens, setBiens]       = useState<Bien[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Bien | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const prevCount               = useRef(0)
  const [filters, setFilters]   = useState<FilterState>({
    recommandation: 'tous', commune: '', prixMax: 120000, scoreMin: 0,
  })

  const fetchBiens = useCallback(async () => {
    let q = supabase.from('biens').select('*').order('date_detection', { ascending: false }).limit(500)
    if (filters.recommandation !== 'tous') q = q.eq('recommandation', filters.recommandation)
    if (filters.commune) q = q.ilike('ville', `%${filters.commune}%`)
    if (filters.prixMax < 120000) q = q.lte('prix', filters.prixMax)
    if (filters.scoreMin > 0) q = q.gte('score_ia', filters.scoreMin)

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
    analyses: biens.filter(b => (b.score_ia ?? 0) > 0).length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 28px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700, color: '#fff',
            boxShadow: '0 0 20px rgba(139,92,246,0.4)',
          }}>I</div>
          <div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 15, fontWeight: 700, letterSpacing: '0.05em' }}>IMMO PRO</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 1 }}>Wallonie · max 120 000€</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {lastUpdate && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Màj {lastUpdate.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.div
              animate={{ boxShadow: ['0 0 0 0 rgba(34,197,94,0.5)', '0 0 0 6px rgba(34,197,94,0)', '0 0 0 0 rgba(34,197,94,0.5)'] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.08em' }}>TEMPS RÉEL</span>
          </div>
        </div>
      </header>

      {/* ── Layout ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>

        {/* Sidebar */}
        <nav style={{
          width: 72, flexShrink: 0,
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          {[
            { icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>, active: true },
            { icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>, active: false },
            { icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>, active: false },
          ].map((item, i) => (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.active ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: item.active ? 'var(--violet)' : 'var(--muted2)',
              boxShadow: item.active ? '0 0 16px rgba(139,92,246,0.25)' : 'none',
              cursor: 'pointer',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
            </div>
          ))}
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: '24px 28px 80px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          <StatsBar stats={stats} />
          <Filters filters={filters} onChange={setFilters} />

          {loading ? (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {Array.from({ length: 9 }).map((_, i) => <BienCardSkeleton key={i} />)}
            </div>
          ) : biens.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
              </p>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {biens.map((b, i) => (
                  <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {selected && <BienModal bien={selected} onClose={() => setSelected(null)} />}

      <AnimatePresence>
        {toast && <Toast key={toast} msg={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}
