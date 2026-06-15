'use client'

import { useEffect, useState } from 'react'
import { supabase, type HistoriquePrix } from '@/lib/supabase'

export default function PriceChart({ bienId }: { bienId: string }) {
  const [data, setData] = useState<HistoriquePrix[]>([])

  useEffect(() => {
    supabase
      .from('historique_prix')
      .select('prix,date_check')
      .eq('bien_id', bienId)
      .order('date_check')
      .then(({ data }) => { if (data) setData(data as HistoriquePrix[]) })
  }, [bienId])

  if (data.length < 2) {
    return (
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '16px',
        fontSize: 12, color: 'var(--muted)', textAlign: 'center',
      }}>
        Pas encore d&apos;historique de prix
      </div>
    )
  }

  const prices = data.map(d => d.prix)
  const minP   = Math.min(...prices)
  const maxP   = Math.max(...prices)
  const range  = maxP - minP || 1

  const W = 600, H = 100, padX = 12, padY = 14
  const innerW = W - padX * 2
  const innerH = H - padY * 2

  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * innerW
    const y = padY + (1 - (d.prix - minP) / range) * innerH
    return { x, y, prix: d.prix, date: d.date_check }
  })

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length - 1].x},${H}`

  const first = prices[0]
  const last  = prices[prices.length - 1]
  const diff  = last - first
  const color = diff <= 0 ? '#22C55E' : '#EF4444'
  const gradId = `pg-${bienId.slice(0, 8)}`

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {data.length} points · {new Date(data[0].date_check).toLocaleDateString('fr-BE')} → {new Date(data[data.length-1].date_check).toLocaleDateString('fr-BE')}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>
          {diff > 0 ? '+' : ''}{diff.toLocaleString('fr-BE')} €
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon points={area} fill={`url(#${gradId})`} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="var(--surface)" strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{first.toLocaleString('fr-BE')} €</span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{last.toLocaleString('fr-BE')} €</span>
      </div>
    </div>
  )
}
