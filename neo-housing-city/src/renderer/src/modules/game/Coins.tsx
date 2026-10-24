import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DynamicDrawUsage, Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import type { Plot } from '../city/layout'
import { PIN_Y } from '../housing/Pins'
import { finance, type Property } from '../housing/properties'
import type { Building } from '../housing/types'
import { animStore } from '../life/animStore'

// Pièces d'or qui s'envolent des toits : plus un logement rapporte, plus il en émet.
// (1 pièce par seconde ≈ 2 000 € de marge mensuelle ; aucune pièce si la marge est nulle ou négative.)
const POOL = 6
const LIFE = 1.7
const m = new Matrix4()
const q = new Quaternion()
const e = new Euler()
const v = new Vector3()
const s = new Vector3()

interface Slot { born: number; dx: number; dz: number }

export function Coins({ buildings, plots, props }: { buildings: Building[]; plots: Plot[]; props: Property[] }) {
  const mesh = useRef<InstancedMesh>(null)
  const time = useRef(0)
  const acc = useRef<number[]>(buildings.map((_, i) => i * 0.37))
  const slots = useRef<Slot[][]>(buildings.map(() => Array.from({ length: POOL }, () => ({ born: -99, dx: 0, dz: 0 }))))

  useLayoutEffect(() => {
    mesh.current!.instanceMatrix.setUsage(DynamicDrawUsage)
    for (let i = 0; i < buildings.length * POOL; i++) mesh.current!.setMatrixAt(i, m.makeScale(0, 0, 0))
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [buildings])

  useFrame((_, dt) => {
    if (!animStore.enabled || !mesh.current) return
    const d = Math.min(dt, 0.05)
    time.current += d
    const t = time.current
    buildings.forEach((b, bi) => {
      const p = props.find((x) => x.buildingId === b.id)
      const margin = p ? finance(p).margin : 0
      const rate = Math.max(0, margin) / 2000
      acc.current[bi] += d * rate
      if (acc.current[bi] >= 1) {
        acc.current[bi] -= 1
        const free = slots.current[bi].find((x) => t - x.born > LIFE)
        if (free) { free.born = t; free.dx = (Math.random() - 0.5) * 0.5; free.dz = (Math.random() - 0.5) * 0.5 }
      }
      const plot = plots.find((x) => x.id === b.plotId)!
      const baseY = plot.top + PIN_Y[b.model] - 0.35
      slots.current[bi].forEach((c, k) => {
        const age = t - c.born
        const i = bi * POOL + k
        if (age < 0 || age > LIFE) { mesh.current!.setMatrixAt(i, m.makeScale(0, 0, 0)); return }
        const u = age / LIFE
        const scale = u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1
        q.setFromEuler(e.set(Math.PI / 2, age * 7, 0))
        m.compose(v.set(b.position.x + c.dx, baseY + u * 1.3, b.position.z + c.dz), q, s.setScalar(Math.max(0.0001, scale)))
        mesh.current!.setMatrixAt(i, m)
      })
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length * POOL]} frustumCulled={false}>
      <cylinderGeometry args={[0.11, 0.11, 0.03, 18]} />
      <meshStandardMaterial color="#f7c948" emissive="#c98a00" emissiveIntensity={0.35} metalness={0.7} roughness={0.25} />
    </instancedMesh>
  )
}
