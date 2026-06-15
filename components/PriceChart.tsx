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
        backgroundColor: '#FAFAF8', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px',
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

  const W = 600, H = 110, padX = 14, padY = 16
  const innerW = W - padX * 2
  const innerH = H - padY * 2

  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padY + (1 - (d.prix - minP) / range) * innerH,
    prix: d.prix,
    date: d.date_check,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length - 1].x},${H}`

  const first = prices[0]
  const last  = prices[prices.length - 1]
  const diff  = last - first
  const color = diff <= 0 ? '#2D6A4F' : '#C1121F'
  const gradId = `pg-${bienId.slice(0, 8)}`

  return (
    <div style={{
      backgroundColor: '#FAFAF8', border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {data.length} points · {new Date(data[0].date_check).toLocaleDateString('fr-BE')} → {new Date(data[data.length - 1].date_check).toLocaleDateString('fr-BE')}
        </span>
        <span style={{ fontSize: 15, fontWeight: 800, color }}>
          {diff > 0 ? '+' : ''}{diff.toLocaleString('fr-BE')} €
        </span>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.14" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="2" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{first.toLocaleString('fr-BE')} €</span>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{last.toLocaleString('fr-BE')} €</span>
      </div>
    </div>
  )
}
