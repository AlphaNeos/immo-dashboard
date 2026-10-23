import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import type { Mesh } from 'three'

// Décor d'accueil uniquement : prouve que Three.js, React Three Fiber
// et Drei fonctionnent. Ce n'est PAS la ville.
function Core() {
  const ref = useRef<Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.3
  })
  return (
    <Float speed={1.5} floatIntensity={0.8}>
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshBasicMaterial color="#3de0ff" wireframe />
      </mesh>
    </Float>
  )
}

export function BackgroundScene() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
      <Stars radius={60} depth={40} count={2500} factor={3} fade speed={1} />
      <Core />
    </Canvas>
  )
}
