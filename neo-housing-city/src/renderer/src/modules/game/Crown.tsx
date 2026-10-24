import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { animStore } from '../life/animStore'

// Couronne dorée au-dessus du logement qui rapporte le plus.
export function Crown({ x, y, z }: { x: number; y: number; z: number }) {
  const g = useRef<Group>(null)
  const t = useRef(0)
  useFrame((_, dt) => {
    if (animStore.enabled) t.current += Math.min(dt, 0.05)
    if (g.current) {
      g.current.rotation.y = t.current * 0.9
      g.current.position.y = y + Math.sin(t.current * 2) * 0.05
    }
  })
  const gold = <meshStandardMaterial color="#f7c948" emissive="#d99a00" emissiveIntensity={0.5} metalness={0.8} roughness={0.25} />
  return (
    <group ref={g} position={[x, y, z]} scale={1.6}>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 20, 1, true]} />
        {gold}
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} position={[Math.cos(a) * 0.15, 0.09, Math.sin(a) * 0.15]}>
            <mesh>
              <coneGeometry args={[0.04, 0.12, 6]} />
              {gold}
            </mesh>
            <mesh position={[0, 0.075, 0]}>
              <icosahedronGeometry args={[0.025, 0]} />
              <meshStandardMaterial color={i % 2 ? '#ff4d6d' : '#3de0ff'} emissive={i % 2 ? '#ff4d6d' : '#3de0ff'} emissiveIntensity={0.6} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
