import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DynamicDrawUsage, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import type { Plot } from '../city/layout'
import { NEIGHBORHOOD } from '../housing/neighborhood'
import { animStore } from './animStore'
import { timed } from './perf'

// Vie des équipements : joueurs de padel qui échangent, nageurs qui font des longueurs.
const LAWN = 0.04
const UP = new Vector3(0, 1, 0)
const m = new Matrix4()
const q = new Quaternion()
const v = new Vector3()
const s = new Vector3()

export function Leisure({ plots }: { plots: Plot[] }) {
  const invalidate = useThree((st) => st.invalidate)
  const padel = useMemo(() => plots.find((p) => p.id === NEIGHBORHOOD.find((d) => d.model === 'padel')?.plotId), [plots])
  const pool = useMemo(() => plots.find((p) => p.id === NEIGHBORHOOD.find((d) => d.model === 'pool')?.plotId), [plots])
  const bodies = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const balls = useRef<InstancedMesh>(null)
  const swim = useRef<InstancedMesh>(null)
  const t = useRef(0)
  const PLAYERS = 8 // 2 terrains x 4 joueurs (double)
  const SWIMMERS = 4

  const write = () => {
    const time = t.current
    if (padel && bodies.current && heads.current && balls.current) {
      let i = 0
      ;[-1.4, 1.4].forEach((cx, c) => {
        const cz = -0.45
        // balle : aller-retour par-dessus le filet
        const u = (time * 0.55 + c * 0.37) % 2
        const dir = u < 1 ? 1 : -1
        const k = u < 1 ? u : u - 1
        const bz = cz + dir * (-1.3 + 2.6 * k)
        const bx = cx + Math.sin(time * 1.3 + c) * 0.5
        m.compose(v.set(padel.x + bx, padel.top + LAWN + 0.12 + Math.sin(k * Math.PI) * 0.55, padel.z + bz), q.identity(), s.setScalar(1))
        balls.current!.setMatrixAt(c, m)
        for (const side of [-1, 1]) for (const lane of [-0.5, 0.5]) {
          const follow = Math.max(-0.75, Math.min(0.75, bx - cx + lane * 0.6))
          const px = cx + follow * 0.6 + lane * 0.5
          const pz = cz + side * (1.25 + Math.sin(time * 2 + i) * 0.12)
          const yaw = side > 0 ? Math.PI : 0
          const bob = Math.abs(Math.sin(time * 6 + i)) * 0.02
          q.setFromAxisAngle(UP, yaw)
          m.compose(v.set(padel.x + px, padel.top + LAWN + 0.03 + 0.11 + bob, padel.z + pz), q, s.set(0.11, 0.22, 0.08))
          bodies.current!.setMatrixAt(i, m)
          m.compose(v.set(padel.x + px, padel.top + LAWN + 0.03 + 0.29 + bob, padel.z + pz), q, s.setScalar(0.09))
          heads.current!.setMatrixAt(i, m)
          i++
        }
      })
      bodies.current.instanceMatrix.needsUpdate = true
      heads.current.instanceMatrix.needsUpdate = true
      balls.current.instanceMatrix.needsUpdate = true
    }
    if (pool && swim.current) {
      for (let k = 0; k < SWIMMERS; k++) {
        const speed = 0.35 + k * 0.06
        const u = (time * speed / 3.0 + k * 0.29) % 2
        const x = -0.4 - 1.5 + 3.0 * (u < 1 ? u : 2 - u)
        const z = -1.325 + k * 0.55
        q.setFromAxisAngle(UP, u < 1 ? Math.PI / 2 : -Math.PI / 2)
        m.compose(v.set(pool.x + x, pool.top + LAWN + 0.05, pool.z - 0.5 + 0.5 + z), q, s.set(0.09, 0.05, 0.26))
        swim.current.setMatrixAt(k, m)
      }
      swim.current.instanceMatrix.needsUpdate = true
    }
  }

  useLayoutEffect(() => {
    const col = new Color()
    const team = ['#ff6b8b', '#ff6b8b', '#3a7bd5', '#3a7bd5', '#f7c948', '#f7c948', '#35d07f', '#35d07f']
    for (let i = 0; i < PLAYERS; i++) {
      bodies.current?.setColorAt(i, col.set(team[i]))
      heads.current?.setColorAt(i, col.set(['#f5cba7', '#e0ac69', '#c68642', '#ffdbac'][i % 4]))
    }
    for (let k = 0; k < SWIMMERS; k++) swim.current?.setColorAt(k, col.set(['#e74c3c', '#f7c948', '#ffffff', '#2c3e50'][k]))
    for (const r of [bodies, heads, balls, swim]) {
      r.current?.instanceMatrix.setUsage(DynamicDrawUsage)
      if (r.current?.instanceColor) r.current.instanceColor.needsUpdate = true
    }
    write()
    invalidate()
  }, [padel, pool, invalidate])

  useFrame((_, dt) => {
    if (!animStore.enabled) return
    timed('leisure', () => {
      t.current += Math.min(dt, 0.05)
      write()
    })
  })

  return (
    <group>
      {padel && (
        <>
          <instancedMesh ref={bodies} args={[undefined, undefined, PLAYERS]} frustumCulled={false}>
            <boxGeometry />
            <meshStandardMaterial roughness={0.7} />
          </instancedMesh>
          <instancedMesh ref={heads} args={[undefined, undefined, PLAYERS]} frustumCulled={false}>
            <icosahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial roughness={0.8} />
          </instancedMesh>
          <instancedMesh ref={balls} args={[undefined, undefined, 2]} frustumCulled={false}>
            <icosahedronGeometry args={[0.035, 1]} />
            <meshStandardMaterial color="#e8f54a" emissive="#c8d830" emissiveIntensity={0.4} />
          </instancedMesh>
        </>
      )}
      {pool && (
        <instancedMesh ref={swim} args={[undefined, undefined, SWIMMERS]} frustumCulled={false}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial roughness={0.6} />
        </instancedMesh>
      )}
    </group>
  )
}
