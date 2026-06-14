'use client'

import { useEffect, useState } from 'react'
import { supabase, type HistoriquePrix } from '@/lib/supabase'

export default function PriceChart({ bienId }: { bienId: string }) {
  const [data, setData] = useState<HistoriquePrix[]>([])

  useEffect(() => {
    supabase.from('historique_prix')
      .select('prix,date_check')
      .eq('bien_id', bienId)
      .order('date_check')
      .then(({ data }) => { if (data) setData(data as HistoriquePrix[]) })
  }, [bienId])

  if (data.length < 2) return null

  const prices  = data.map(d => d.prix)
  const minP    = Math.min(...prices) * 0.98
  const maxP    = Math.max(...prices) * 1.02
  const range   = maxP - minP || 1
  const W = 300, H = 80, pad = 8

  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = H - pad - ((d.prix - minP) / range) * (H - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const first = prices[0], last = prices[prices.length - 1]
  const diff  = last - first
  const color = diff <= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8 }} className="p-3">
      <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
        Historique prix ({data.length} points) ·{' '}
        <span style={{ color }}>{diff > 0 ? '+' : ''}{diff.toLocaleString('fr-BE')}€</span>
      </p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - pad * 2)
          const y = H - pad - ((d.prix - minP) / range) * (H - pad * 2)
          return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
        })}
      </svg>
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}>
        <span>{first.toLocaleString('fr-BE')}€</span>
        <span>{last.toLocaleString('fr-BE')}€</span>
      </div>
    </div>
  )
}
