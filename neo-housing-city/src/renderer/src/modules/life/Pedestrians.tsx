import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, DynamicDrawUsage, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'
import { SIDEWALK_TOP } from '../city/layout'
import { animStore } from './animStore'
import { timed } from './perf'
import { PedestrianSim } from './pedestrians'

const ID = new Quaternion()
const UP = new Vector3(0, 1, 0)
const ONE = new Vector3(1, 1, 1)
const v = new Vector3()
const s3 = new Vector3()
const base = new Matrix4()
const m1 = new Matrix4()
const m2 = new Matrix4()
const m3 = new Matrix4()
const out = new Matrix4()
const qy = new Quaternion()

const T = (x: number, y: number, z: number) => new Matrix4().makeTranslation(x, y, z)
const S = (x: number, y: number, z: number) => new Matrix4().compose(v.set(0, 0, 0), ID, s3.set(x, y, z))

const TORSO = T(0, 0.235, 0).multiply(S(0.12, 0.15, 0.08))
const HEAD = T(0, 0.345, 0).multiply(S(0.1, 0.1, 0.1))
const LEG_SCALE = S(0.045, 0.17, 0.045)
const ARM_SCALE = S(0.035, 0.14, 0.035)

export function Pedestrians({ centers }: { centers: { x: number; z: number }[] }) {
  const invalidate = useThree((s) => s.invalidate)
  const sim = useMemo(() => new PedestrianSim(centers, 2), [centers])
  const torso = useRef<InstancedMesh>(null)
  const head = useRef<InstancedMesh>(null)
  const legs = useRef<InstancedMesh>(null)
  const arms = useRef<InstancedMesh>(null)
  const smoothYaw = useRef<number[]>(sim.walkers.map((w) => w.yaw))

  const write = (dt: number) => {
    sim.walkers.forEach((w, i) => {
      // le personnage pivote doucement dans les coins
      let d = w.yaw - smoothYaw.current[i]
      d = Math.atan2(Math.sin(d), Math.cos(d))
      smoothYaw.current[i] += d * Math.min(1, dt * 8 + (dt === 0 ? 1 : 0))
      const swing = Math.sin(w.phase) * 0.7
      const bob = Math.abs(Math.sin(w.phase)) * 0.012
      base.compose(v.set(w.x, SIDEWALK_TOP + bob, w.z), qy.setFromAxisAngle(UP, smoothYaw.current[i]), ONE)
      torso.current!.setMatrixAt(i, out.multiplyMatrices(base, TORSO))
      head.current!.setMatrixAt(i, out.multiplyMatrices(base, HEAD))
      for (const side of [0, 1]) {
        const sgn = side === 0 ? -1 : 1
        // jambes : pivot à la hanche ; bras : pivot à l'épaule, en opposition de phase
        m1.makeRotationX(swing * sgn)
        m2.copy(T(sgn * 0.03, 0.17, 0)).multiply(m1).multiply(T(0, -0.085, 0)).multiply(LEG_SCALE)
        legs.current!.setMatrixAt(i * 2 + side, out.multiplyMatrices(base, m2))
        m3.makeRotationX(-swing * sgn * 0.8)
        m2.copy(T(sgn * 0.08, 0.3, 0)).multiply(m3).multiply(T(0, -0.065, 0)).multiply(ARM_SCALE)
        arms.current!.setMatrixAt(i * 2 + side, out.multiplyMatrices(base, m2))
      }
    })
    for (const m of [torso, head, legs, arms]) m.current!.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const col = new Color()
    sim.walkers.forEach((w, i) => {
      torso.current!.setColorAt(i, col.set(w.shirt))
      head.current!.setColorAt(i, col.set(w.skin))
      for (const k of [0, 1]) {
        legs.current!.setColorAt(i * 2 + k, col.set(w.pants))
        arms.current!.setColorAt(i * 2 + k, col.set(w.shirt))
      }
    })
    for (const m of [torso, head, legs, arms]) {
      m.current!.instanceColor!.needsUpdate = true
      m.current!.instanceMatrix.setUsage(DynamicDrawUsage)
    }
    write(0)
    invalidate()
  }, [sim, invalidate])

  useFrame((_, dt) => {
    timed('pedestrians', () => {
      if (!animStore.enabled) return
      const d = Math.min(dt, 0.05)
      sim.update(d)
      write(d)
    })
  })

  const n = sim.walkers.length
  return (
    <group>
      <instancedMesh ref={torso} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, n]} frustumCulled={false}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={legs} args={[undefined, undefined, n * 2]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={arms} args={[undefined, undefined, n * 2]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </group>
  )
}
