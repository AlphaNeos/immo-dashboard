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
        backgroundColor: 'rgba(245,245,240,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              IMMO PRO
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.04em' }}>
              Wallonie complète · max 120 000€
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {lastUpdate && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Mis à jour à {fmtTime(lastUpdate)}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', backgroundColor: '#2D6A4F',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 11, color: '#2D6A4F', fontWeight: 600, letterSpacing: '0.04em' }}>
                TEMPS RÉEL
              </span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 28px 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <StatsBar stats={stats} />

        {/* ── Filtres ──────────────────────────────────────────────────────── */}
        <Filters filters={filters} onChange={setFilters} />

        {/* ── Grille ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 14 }}>
            <div style={{
              width: 30, height: 30,
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>Chargement des biens…</span>
          </div>
        ) : biens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>🏚</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Aucun bien trouvé</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>L&apos;agent surveille le marché toutes les 30 minutes</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {biens.length} bien{biens.length > 1 ? 's' : ''} trouvé{biens.length > 1 ? 's' : ''}
            </p>
            <div style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            }}>
              {biens.map((b, i) => (
                <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selected && <BienModal bien={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
