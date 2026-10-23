import { useMemo } from 'react'
import { glassKey, patchGlass } from '../life/shaders'
import { getModelGeometry } from './models'
import type { BuildingModelId } from './types'

// Un bâtiment = 2 maillages (murs + vitres) = 2 appels graphiques.
// `y` = hauteur de la surface de la parcelle.
export function BuildingMesh({ model, x, y, z, rotationY }: { model: BuildingModelId; x: number; y: number; z: number; rotationY: number }) {
  const geo = useMemo(() => getModelGeometry(model), [model])
  return (
    <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.body} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.85} />
      </mesh>
      {geo.glass && (
        <mesh geometry={geo.glass}>
          <meshStandardMaterial vertexColors roughness={0.15} color="#ffffff" emissive="#2d5d78" emissiveIntensity={0.3} onBeforeCompile={patchGlass} customProgramCacheKey={glassKey} />
        </mesh>
      )}
    </group>
  )
}
