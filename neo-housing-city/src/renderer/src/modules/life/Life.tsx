import { useMemo } from 'react'
import { buildCity } from '../city/layout'
import { createBuildings } from '../housing/buildings'
import { Decor } from './Decor'
import { Leisure } from './Leisure'
import { NightGlow } from './NightGlow'
import { Pedestrians } from './Pedestrians'
import { Traffic } from './Traffic'

// Tout ce qui bouge dans la ville. Chaque système est indépendant et s'arrête avec le bouton « Animations ».
export function Life({ data }: { data: ReturnType<typeof buildCity> }) {
  const buildings = useMemo(() => createBuildings(data.plots), [data])
  const centers = useMemo(() => data.urban.map((b) => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 })), [data])
  return (
    <group>
      <Traffic />
      <Pedestrians centers={centers} />
      <Decor plots={data.plots} buildings={buildings} />
      <NightGlow lamps={data.lamps} />
      <Leisure plots={data.plots} />
    </group>
  )
}
