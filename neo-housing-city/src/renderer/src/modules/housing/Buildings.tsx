import { useMemo } from 'react'
import type { Plot } from '../city/layout'
import { BuildingMesh } from './BuildingMesh'
import { createBuildings } from './buildings'

export function Buildings({ plots }: { plots: Plot[] }) {
  const buildings = useMemo(() => createBuildings(plots), [plots])
  return (
    <group>
      {buildings.map((b) => {
        const plot = plots.find((p) => p.id === b.plotId)!
        return <BuildingMesh key={b.id} model={b.model} x={b.position.x} y={plot.top} z={b.position.z} rotationY={b.rotationY} />
      })}
    </group>
  )
}
