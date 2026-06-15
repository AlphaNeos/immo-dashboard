'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Bien } from '@/lib/supabase'
import BienCard from '@/components/BienCard'
import BienModal from '@/components/BienModal'
import StatsBar from '@/components/StatsBar'
import Filters, { FilterState } from '@/components/Filters'

export default function HomePage() {
  const [biens, setBiens]       = useState<Bien[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Bien | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
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
      setBiens(data as Bien[])
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: 'rgba(13, 15, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 60,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo */}
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>I</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                Immo Agent Pro
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                Wallonie complète · max 120 000€
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {lastUpdate && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                Màj {fmtTime(lastUpdate)}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--green)',
                boxShadow: '0 0 6px #22C55E',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>Temps réel</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 24px 60px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <StatsBar stats={stats} />

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <Filters filters={filters} onChange={setFilters} />

        {/* ── Grille ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
            <div style={{
              width: 28, height: 28,
              border: '2px solid var(--indigo)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement des biens…</span>
          </div>
        ) : biens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: 'grayscale(1)' }}>🏚</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Aucun bien trouvé</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>L&apos;agent surveille le marché toutes les 30 minutes</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
              {biens.length} bien{biens.length > 1 ? 's' : ''} · cliquez pour le détail complet
            </p>
            <div style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            }}>
              {biens.map(b => (
                <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {selected && <BienModal bien={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
      `}</style>
    </div>
  )
}
