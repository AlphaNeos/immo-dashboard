import { useMemo } from 'react'
import type { Plot } from '../city/layout'
import { glassKey, patchGlass } from '../life/shaders'
import { getDecorGeometry } from './models/decor'
import { NEIGHBORHOOD } from './neighborhood'

// Voisins, commerces et loisirs : 2 appels graphiques chacun, non cliquables (ils ne sont pas à vous).
function DecorMesh({ id, variant, x, y, z, rotationY }: { id: Parameters<typeof getDecorGeometry>[0]; variant: number; x: number; y: number; z: number; rotationY: number }) {
  const geo = useMemo(() => getDecorGeometry(id, variant), [id, variant])
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.body} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.85} />
      </mesh>
      {geo.glass && (
        <mesh geometry={geo.glass}>
          <meshStandardMaterial vertexColors roughness={0.15} emissive="#2d5d78" emissiveIntensity={0.3} transparent opacity={0.85} onBeforeCompile={patchGlass} customProgramCacheKey={glassKey} />
        </mesh>
      )}
    </group>
  )
}

export function Neighborhood({ plots }: { plots: Plot[] }) {
  return (
    <group>
      {NEIGHBORHOOD.map((d) => {
        const p = plots.find((x) => x.id === d.plotId)
        if (!p) return null
        return <DecorMesh key={d.plotId} id={d.model} variant={d.variant} x={p.x} y={p.top} z={p.z} rotationY={d.facing ?? p.facing} />
      })}
    </group>
  )
}
