import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DynamicDrawUsage, Matrix4, Quaternion, Vector3, type InstancedMesh, type Mesh, type MeshBasicMaterial } from 'three'
import { POND, type Plot } from '../city/layout'
import { CHIMNEYS } from '../housing/models'
import type { Building } from '../housing/types'
import { animStore } from './animStore'
import { nightAt } from './lighting'
import { timed } from './perf'

const ID = new Quaternion()
const ONE = new Vector3(1, 1, 1)
const v = new Vector3()
const s3 = new Vector3()
const m = new Matrix4()
const frac = (x: number) => x - Math.floor(x)

// Petites animations décoratives : jet de la fontaine, ondulations de l'étang, fumée des cheminées, oiseaux.
export function Decor({ plots, buildings }: { plots: Plot[]; buildings: Building[] }) {
  const invalidate = useThree((s) => s.invalidate)
  const time = useRef(0)
  const fountain = plots.find((p) => p.kind === 'fountain')
  const drops = useRef<InstancedMesh>(null)
  const smoke = useRef<InstancedMesh>(null)
  const birds = useRef<InstancedMesh>(null)
  const rings = [useRef<Mesh>(null), useRef<Mesh>(null), useRef<Mesh>(null)]
  const ringMats = [useRef<MeshBasicMaterial>(null), useRef<MeshBasicMaterial>(null), useRef<MeshBasicMaterial>(null)]

  const chimneys = useMemo(() => {
    const out: Vector3[] = []
    for (const b of buildings) {
      const plot = plots.find((p) => p.id === b.plotId)!
      for (const [lx, ly, lz] of CHIMNEYS[b.model] ?? []) {
        const c = Math.cos(b.rotationY), s = Math.sin(b.rotationY)
        out.push(new Vector3(b.position.x + lx * c + lz * s, plot.top + ly, b.position.z - lx * s + lz * c))
      }
    }
    return out
  }, [buildings, plots])

  const DROPS = 14, PUFFS = 5, BIRDS = 4

  const write = () => {
    const t = time.current
    if (fountain && drops.current) {
      for (let i = 0; i < DROPS; i++) {
        const u = frac(t * 0.7 + i / DROPS)
        const a = i * 2.4
        const r = (0.08 + 0.55 * u) * 1.8
        const y = (0.7 + 0.6 * 4 * u * (1 - u) - 0.53 * u) * 1.8
        m.compose(v.set(fountain.x + Math.cos(a) * r, fountain.top + y, fountain.z + Math.sin(a) * r), ID, s3.setScalar(0.05))
        drops.current.setMatrixAt(i, m)
      }
      drops.current.instanceMatrix.needsUpdate = true
    }
    if (smoke.current) {
      chimneys.forEach((c, ci) => {
        for (let k = 0; k < PUFFS; k++) {
          const u = frac(t * 0.22 + k / PUFFS + ci * 0.37)
          const size = (0.05 + 0.13 * u) * (u > 0.8 ? (1 - u) / 0.2 : 1)
          m.compose(v.set(c.x + u * 0.35 + Math.sin(t + k) * 0.02, c.y + u * 0.75, c.z + Math.cos(t * 0.8 + k) * 0.02), ID, s3.setScalar(Math.max(0.001, size)))
          smoke.current!.setMatrixAt(ci * PUFFS + k, m)
        }
      })
      smoke.current.instanceMatrix.needsUpdate = true
    }
    if (birds.current) {
      for (let b = 0; b < BIRDS; b++) {
        const ang = t * (0.12 + b * 0.02) + b * 1.7
        const R = 9 + b * 3
        const bx = Math.cos(ang) * R, bz = Math.sin(ang * 1.1) * R * 0.8
        const yaw = Math.atan2(-Math.sin(ang), Math.cos(ang * 1.1) * 0.88)
        const flap = Math.sin(t * 9 + b) * 0.6
        for (const side of [0, 1]) {
          const sgn = side === 0 ? -1 : 1
          const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
          const roll = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), sgn * flap)
          const off = new Vector3(sgn * 0.1, 0, 0).applyQuaternion(q)
          m.compose(v.set(bx + off.x, 6.5 + b * 0.6 + Math.sin(t * 0.5 + b), bz + off.z), q.multiply(roll), s3.set(0.2, 0.012, 0.07))
          birds.current.setMatrixAt(b * 2 + side, m)
        }
      }
      birds.current.instanceMatrix.needsUpdate = true
    }
    rings.forEach((r, i) => {
      const u = frac(t * 0.18 + i / 3)
      if (r.current) r.current.scale.set(0.15 + u * 0.85, 1, 0.15 + u * 0.85)
      if (ringMats[i].current) ringMats[i].current!.opacity = 0.55 * (1 - u)
    })
  }

  useLayoutEffect(() => {
    for (const r of [drops, smoke, birds]) r.current?.instanceMatrix.setUsage(DynamicDrawUsage)
    write()
    invalidate()
  }, [chimneys, invalidate])

  useFrame((_, dt) => {
    timed('decor', () => {
      if (animStore.enabled) {
        time.current += Math.min(dt, 0.05)
        write()
      }
      if (birds.current) birds.current.visible = nightAt(animStore.hours) < 0.6
    })
  })

  return (
    <group>
      {fountain && (
        <instancedMesh ref={drops} args={[undefined, undefined, DROPS]} frustumCulled={false}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#cfeeff" />
        </instancedMesh>
      )}
      <instancedMesh ref={smoke} args={[undefined, undefined, Math.max(1, chimneys.length * PUFFS)]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#e9e9ee" transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={birds} args={[undefined, undefined, BIRDS * 2]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial color="#3a3f4a" />
      </instancedMesh>
      {rings.map((r, i) => (
        <mesh key={i} ref={r} position={[POND.x, 0.056, POND.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[POND.r * 0.9, POND.r * 0.96, 40]} />
          <meshBasicMaterial ref={ringMats[i]} color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
