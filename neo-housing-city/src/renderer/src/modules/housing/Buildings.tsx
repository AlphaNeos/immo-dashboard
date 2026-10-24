import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { cameraStore } from '../city/cameraStore'
import type { Plot } from '../city/layout'
import { BuildingMesh } from './BuildingMesh'
import { createBuildings } from './buildings'
import { Pin } from './Pins'
import { propertyStore, useProperties } from './propertyStore'
import { selection, useSelection } from './selection'
import { Coins } from '../game/Coins'
import { Crown } from '../game/Crown'
import { useSimPreview, withPreview } from '../game/simulate'
import { finance } from './properties'
import { PIN_Y } from './Pins'

const PANEL_PX = 400 // largeur de la fiche (le bâtiment est recentré dans l'espace restant)

export function Buildings({ plots }: { plots: Plot[] }) {
  const buildings = useMemo(() => createBuildings(plots), [plots])
  const properties = useProperties()
  const preview = useSimPreview()
  const { hoveredId, selectedId } = useSelection()
  const invalidate = useThree((s) => s.invalidate)

  // Un changement de survol / sélection / fiche redessine la scène.
  useEffect(() => { invalidate() }, [hoveredId, selectedId, properties, preview, invalidate])

  // Cadrage de la caméra quand un bâtiment est sélectionné.
  useEffect(() => {
    selection.onSelect = (id) => {
      const b = buildings.find((x) => x.id === id)
      if (b) cameraStore.focusOn(b.position.x, b.position.z, 46, PANEL_PX)
    }
    return () => { selection.onSelect = null }
  }, [buildings])

  // le logement qui rapporte le plus porte la couronne
  const top = [...properties].sort((a, b) => finance(b).margin - finance(a).margin)[0]
  const topB = buildings.find((b) => b.id === top?.buildingId)
  const topPlot = topB && plots.find((p) => p.id === topB.plotId)

  return (
    <group>
      <Coins buildings={buildings} plots={plots} props={properties.map((p) => withPreview(p, preview))} />
      {topB && topPlot && <Crown x={topB.position.x} y={topPlot.top + PIN_Y[topB.model] + 0.15 + 0.95} z={topB.position.z} />}
      {buildings.map((b) => {
        const plot = plots.find((p) => p.id === b.plotId)!
        const base = propertyStore.get(b.id)
        const prop = base && withPreview(base, preview)
        const hovered = hoveredId === b.id
        const selected = selectedId === b.id
        const pick = () => { selection.select(b.id); selection.onSelect?.(b.id) }
        return (
          <group key={b.id}>
            <BuildingMesh
              buildingId={b.id} model={b.model} x={b.position.x} y={plot.top} z={b.position.z} rotationY={b.rotationY}
              hovered={hovered} selected={selected} onHover={(o) => selection.hover(o ? b.id : null)} onSelect={pick}
            />
            {prop && (
              <Pin building={b} top={plot.top} property={prop} hovered={hovered} selected={selected}
                onHover={(o) => selection.hover(o ? b.id : null)} onSelect={pick} />
            )}
            {selected && (
              <mesh position={[b.position.x, plot.top + 0.07, b.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.95, 2.1, 48]} />
                <meshBasicMaterial color="#3de0ff" transparent opacity={0.85} depthWrite={false} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
