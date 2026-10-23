import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Color, DynamicDrawUsage, Matrix4, Quaternion, Vector3, type InstancedMesh, type MeshBasicMaterial } from 'three'
import { animStore } from './animStore'
import { glowTexture } from './glow'
import { nightAt } from './lighting'
import { timed } from './perf'
import { TrafficSim } from './traffic'

export const CAR_COUNT = 12
const ROAD_Y = 0.05

// Gabarits : 0 berline, 1 compacte, 2 utilitaire (dimensions en unités de la ville).
const KINDS = [
  { w: 0.38, bodyL: 0.8, bodyH: 0.1, cabL: 0.42, cabZ: -0.04, cabH: 0.1 },
  { w: 0.38, bodyL: 0.72, bodyH: 0.1, cabL: 0.46, cabZ: -0.07, cabH: 0.105 },
  { w: 0.4, bodyL: 0.86, bodyH: 0.14, cabL: 0.66, cabZ: -0.08, cabH: 0.14 }
]

const ID = new Quaternion()
const UP = new Vector3(0, 1, 0)
const ONE = new Vector3(1, 1, 1)
const tmpV = new Vector3()
const tmpS = new Vector3()
const base = new Matrix4()
const loc = new Matrix4()
const out = new Matrix4()
const rot = new Matrix4()
const qy = new Quaternion()

const local = (x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
  new Matrix4().compose(tmpV.set(x, y, z), ID, tmpS.set(sx, sy, sz))

// Précalcul des pièces fixes de chaque gabarit (corps, vitrage, feux, ombre).
const PARTS = KINDS.map((k) => {
  const bodyY = 0.07 + k.bodyH / 2
  const cabY = 0.07 + k.bodyH + k.cabH / 2 - 0.005
  return {
    body: local(0, bodyY, 0, k.w, k.bodyH, k.bodyL),
    cabin: local(0, cabY, k.cabZ, k.w * 0.84, k.cabH, k.cabL),
    glass: local(0, cabY, k.cabZ, k.w * 0.84 + 0.006, k.cabH * 0.55, k.cabL * 0.9),
    lights: [
      local(-0.12, bodyY, k.bodyL / 2, 0.06, 0.04, 0.02),
      local(0.12, bodyY, k.bodyL / 2, 0.06, 0.04, 0.02),
      local(-0.12, bodyY, -k.bodyL / 2, 0.06, 0.04, 0.02),
      local(0.12, bodyY, -k.bodyL / 2, 0.06, 0.04, 0.02)
    ],
    wheels: [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => [sx * (k.w / 2 - 0.01), 0.065, sz * k.bodyL * 0.32]),
    shadow: local(0, 0.003, 0, k.w * 1.5, 1, k.bodyL * 1.3),
    beam: local(0, 0.006, k.bodyL / 2 + 0.55, 0.55, 1, 1.15)
  }
})

export function Traffic() {
  const invalidate = useThree((s) => s.invalidate)
  const sim = useMemo(() => new TrafficSim(CAR_COUNT, 7), [])
  const body = useRef<InstancedMesh>(null)
  const cabin = useRef<InstancedMesh>(null)
  const glass = useRef<InstancedMesh>(null)
  const wheels = useRef<InstancedMesh>(null)
  const lights = useRef<InstancedMesh>(null)
  const shadows = useRef<InstancedMesh>(null)
  const beams = useRef<InstancedMesh>(null)
  const beamMat = useRef<MeshBasicMaterial>(null)

  const write = () => {
    const n = sim.cars.length
    for (let i = 0; i < n; i++) {
      const c = sim.cars[i]
      const p = PARTS[c.kind]
      base.compose(tmpV.set(c.x, ROAD_Y, c.z), qy.setFromAxisAngle(UP, c.yaw), ONE)
      body.current!.setMatrixAt(i, out.multiplyMatrices(base, p.body))
      cabin.current!.setMatrixAt(i, out.multiplyMatrices(base, p.cabin))
      glass.current!.setMatrixAt(i, out.multiplyMatrices(base, p.glass))
      shadows.current!.setMatrixAt(i, out.multiplyMatrices(base, p.shadow))
      beams.current!.setMatrixAt(i, out.multiplyMatrices(base, p.beam))
      for (let k = 0; k < 4; k++) {
        lights.current!.setMatrixAt(i * 4 + k, out.multiplyMatrices(base, p.lights[k]))
        const [wx, wy, wz] = p.wheels[k]
        loc.makeTranslation(wx, wy, wz)
        rot.makeRotationX(c.odo / 0.065)
        wheels.current!.setMatrixAt(i * 4 + k, out.multiplyMatrices(base, loc).multiply(rot))
      }
    }
    for (const m of [body, cabin, glass, wheels, lights, shadows, beams]) m.current!.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const col = new Color()
    sim.cars.forEach((c, i) => {
      body.current!.setColorAt(i, col.set(c.color))
      cabin.current!.setColorAt(i, col.set(c.color).multiplyScalar(0.92))
      for (let k = 0; k < 4; k++) lights.current!.setColorAt(i * 4 + k, col.set(k < 2 ? '#fff3c4' : '#d62d20'))
    })
    body.current!.instanceColor!.needsUpdate = true
    cabin.current!.instanceColor!.needsUpdate = true
    lights.current!.instanceColor!.needsUpdate = true
    for (const m of [body, cabin, glass, wheels, lights, shadows, beams]) m.current!.instanceMatrix.setUsage(DynamicDrawUsage)
    write()
    invalidate()
  }, [sim, invalidate])

  useFrame((_, dt) => {
    timed('traffic', () => {
      if (animStore.enabled) {
        sim.update(Math.min(dt, 0.05))
        write()
      }
      const night = nightAt(animStore.hours)
      if (beamMat.current) beamMat.current.opacity = night * 0.55
      if (beams.current) beams.current.visible = night > 0.02
    })
  })

  const n = CAR_COUNT
  const flat = [Math.PI / -2, 0, 0] as const
  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, n]} frustumCulled={false} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.45} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={cabin} args={[undefined, undefined, n]} frustumCulled={false} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.5} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={glass} args={[undefined, undefined, n]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#27384a" roughness={0.2} />
      </instancedMesh>
      <instancedMesh ref={wheels} args={[undefined, undefined, n * 4]} frustumCulled={false}>
        <cylinderGeometry args={[0.065, 0.065, 0.045, 10]} onUpdate={(g) => g.rotateZ(Math.PI / 2)} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lights} args={[undefined, undefined, n * 4]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={shadows} args={[undefined, undefined, n]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} onUpdate={(g) => g.rotateX(flat[0])} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={beams} args={[undefined, undefined, n]} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} onUpdate={(g) => g.rotateX(flat[0])} />
        <meshBasicMaterial
          ref={beamMat} map={glowTexture()} color="#ffe6a8" transparent opacity={0}
          blending={AdditiveBlending} depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}
