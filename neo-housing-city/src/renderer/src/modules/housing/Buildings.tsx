import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { cameraStore } from '../city/cameraStore'
import type { Plot } from '../city/layout'
import { BuildingMesh } from './BuildingMesh'
import { createBuildings } from './buildings'
import { Pin } from './Pins'
import { propertyStore, useProperties } from './propertyStore'
import { selection, useSelection } from './selection'

const PANEL_PX = 400 // largeur de la fiche (le bâtiment est recentré dans l'espace restant)

export function Buildings({ plots }: { plots: Plot[] }) {
  const buildings = useMemo(() => createBuildings(plots), [plots])
  const properties = useProperties()
  const { hoveredId, selectedId } = useSelection()
  const invalidate = useThree((s) => s.invalidate)

  // Un changement de survol / sélection / fiche redessine la scène.
  useEffect(() => { invalidate() }, [hoveredId, selectedId, properties, invalidate])

  // Cadrage de la caméra quand un bâtiment est sélectionné.
  useEffect(() => {
    selection.onSelect = (id) => {
      const b = buildings.find((x) => x.id === id)
      if (b) cameraStore.focusOn(b.position.x, b.position.z, 46, PANEL_PX)
    }
    return () => { selection.onSelect = null }
  }, [buildings])

  return (
    <group>
      {buildings.map((b) => {
        const plot = plots.find((p) => p.id === b.plotId)!
        const prop = propertyStore.get(b.id)
        const hovered = hoveredId === b.id
        const selected = selectedId === b.id
        const pick = () => { selection.select(b.id); selection.onSelect?.(b.id) }
        return (
          <group key={b.id}>
            <BuildingMesh
              model={b.model} x={b.position.x} y={plot.top} z={b.position.z} rotationY={b.rotationY}
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
