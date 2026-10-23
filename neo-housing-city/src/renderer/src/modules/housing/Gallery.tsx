import { BUILDING_MODELS, type BuildingModelId } from './types'
import { BuildingMesh } from './BuildingMesh'

const ORDER = Object.keys(BUILDING_MODELS) as BuildingModelId[]

// Vitrine des 6 modèles côte à côte (touche F4) : permet de les voir tous, même ceux non placés dans la ville.
export function Gallery() {
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[30, 0.2, 7]} />
        <meshStandardMaterial color="#d8d2c4" roughness={1} />
      </mesh>
      {ORDER.map((m, i) => (
        <BuildingMesh key={m} model={m} x={(i - (ORDER.length - 1) / 2) * 4.2} y={0} z={0} rotationY={0} />
      ))}
    </group>
  )
}
