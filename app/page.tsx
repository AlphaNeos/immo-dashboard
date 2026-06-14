'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, type Bien } from '@/lib/supabase'
import BienCard from '@/components/BienCard'
import BienModal from '@/components/BienModal'
import StatsBar from '@/components/StatsBar'
import Filters, { FilterState } from '@/components/Filters'

export default function HomePage() {
  const [biens, setBiens]           = useState<Bien[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Bien | null>(null)
  const [filters, setFilters]       = useState<FilterState>({
    recommandation: 'tous',
    source: 'tous',
    commune: '',
    prixMax: 150000,
    scoreMin: 0,
  })

  const fetchBiens = useCallback(async () => {
    let q = supabase
      .from('biens')
      .select('*')
      .in('statut', ['notifie', 'analyse', 'nouveau'])
      .order('date_detection', { ascending: false })
      .limit(200)

    if (filters.recommandation !== 'tous')
      q = q.eq('recommandation', filters.recommandation)
    if (filters.source !== 'tous')
      q = q.contains('sources_vues', [filters.source])
    if (filters.commune)
      q = q.ilike('ville', `%${filters.commune}%`)
    if (filters.prixMax < 150000)
      q = q.lte('prix', filters.prixMax)
    if (filters.scoreMin > 0)
      q = q.gte('score_ia', filters.scoreMin)

    const { data, error } = await q
    if (!error && data) setBiens(data as Bien[])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchBiens()

    // Temps réel — écoute les nouvelles insertions / mises à jour
    const channel = supabase
      .channel('biens-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biens' },
        () => fetchBiens()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchBiens])

  const stats = {
    total:    biens.length,
    acheter:  biens.filter(b => b.recommandation === 'ACHETER').length,
    negocier: biens.filter(b => b.recommandation === 'NEGOCIER').length,
    eviter:   biens.filter(b => b.recommandation === 'EVITER').length,
    analyses: biens.filter(b => b.score_ia && b.score_ia > 0).length,
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
              className="sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">I</div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Immo Agent Pro</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Hainaut + Namur · max 150 000€</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Temps réel</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <StatsBar stats={stats} />

        {/* ── Filtres ─────────────────────────────────────────────────────── */}
        <Filters filters={filters} onChange={setFilters} />

        {/* ── Grille ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3" style={{ color: 'var(--muted)' }}>Chargement...</span>
          </div>
        ) : biens.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <p className="text-4xl mb-3">🏚️</p>
            <p className="text-lg font-medium text-white">Aucun bien trouvé</p>
            <p className="text-sm mt-1">L&apos;agent surveille le marché toutes les 30 minutes</p>
          </div>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {biens.length} bien{biens.length > 1 ? 's' : ''} · cliquez pour le détail
            </p>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {biens.map(b => (
                <BienCard key={b.id} bien={b} onClick={() => setSelected(b)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal détail ────────────────────────────────────────────────── */}
      {selected && <BienModal bien={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
