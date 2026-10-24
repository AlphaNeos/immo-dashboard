import { useEffect, useRef } from 'react'
import { HEALTH_COLORS, STATE_LABELS, euroFmt, finance, health } from '@/modules/housing/properties'
import { useProperties } from '@/modules/housing/propertyStore'
import { useSelection } from '@/modules/housing/selection'

// Info-bulle qui suit la souris quand elle passe sur un bâtiment.
export function HoverTooltip() {
  const { hoveredId, selectedId } = useSelection()
  const props = useProperties()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!box.current) return
      const w = box.current.offsetWidth
      const x = Math.min(e.clientX + 16, window.innerWidth - w - 12)
      box.current.style.transform = `translate(${Math.max(8, x)}px, ${e.clientY + 18}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const p = props.find((x) => x.buildingId === hoveredId)
  if (!p || hoveredId === selectedId) return null
  const f = finance(p)
  const h = health(p)
  return (
    <div className="tip" ref={box} role="tooltip">
      <b>{p.name}</b>
      <span>{p.address}</span>
      <span>Propriétaire : {p.owner ?? <em>à renseigner</em>}</span>
      <span style={{ color: HEALTH_COLORS[h] }}>● {STATE_LABELS[p.state]}</span>
      <span>Marge : <b>{euroFmt.format(f.margin)}</b> / mois</span>
      <small>Cliquer pour ouvrir la fiche</small>
    </div>
  )
}
