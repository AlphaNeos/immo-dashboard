import { useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { animStore } from '../life/animStore'
import { HEALTH_COLORS, health, type Property } from './properties'
import type { Building, BuildingModelId } from './types'

// Hauteur du repère au-dessus de chaque modèle.
export const PIN_Y: Record<BuildingModelId, number> = {
  classic: 1.75, 'upper-floor': 1.95, 'modern-villa': 1.5, 'apartment-block': 2.7, studio: 1.2, renovation: 1.75
}

interface Props {
  building: Building
  top: number
  property: Property
  hovered: boolean
  selected: boolean
  onHover: (over: boolean) => void
  onSelect: () => void
}

// Repère d'état flottant : couleur = santé financière / état du logement. Cliquable comme le bâtiment.
export function Pin({ building, top, property, hovered, selected, onHover, onSelect }: Props) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const t = useRef(Math.random() * 6)
  const gl = useThree((s) => s.gl)
  const color = HEALTH_COLORS[health(property)]
  const baseY = top + PIN_Y[building.model] + 0.15

  useFrame((_, dt) => {
    if (animStore.enabled) t.current += Math.min(dt, 0.05)
    if (group.current) {
      group.current.position.y = baseY + (animStore.enabled ? Math.sin(t.current * 2.2) * 0.05 : 0) + (hovered || selected ? 0.08 : 0)
      group.current.rotation.y = animStore.enabled ? t.current * 1.2 : 0
    }
    if (ring.current) {
      const k = selected && animStore.enabled ? 1 + 0.2 * Math.sin(t.current * 4) : 1
      ring.current.scale.set(k, k, k)
    }
  })

  const h = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); gl.domElement.style.cursor = 'pointer' },
    onPointerOut: () => { onHover(false); gl.domElement.style.cursor = 'grab' },
    onClick: (e: ThreeEvent<MouseEvent>) => { if (e.delta < 5) { e.stopPropagation(); onSelect() } }
  }
  const s = (hovered || selected ? 1.25 : 1) * 1.8 // assez grand pour être repéré de loin

  return (
    <group ref={group} position={[building.position.x, baseY, building.position.z]} scale={s} {...h}>
      <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.11, 0]}>
        <coneGeometry args={[0.12, 0.26, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.4} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <icosahedronGeometry args={[0.1, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={ring} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.012, 6, 24]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.45} />
      </mesh>
    </group>
  )
}
