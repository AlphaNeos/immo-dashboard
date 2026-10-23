import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, Matrix4, Quaternion, Vector3, type InstancedMesh, type MeshBasicMaterial } from 'three'
import type { Item } from '../city/layout'
import { animStore } from './animStore'
import { glowTexture } from './glow'
import { nightAt } from './lighting'

const ID = new Quaternion()
const v = new Vector3()
const s3 = new Vector3()
const m = new Matrix4()

// Halos autour des lampadaires et flaques de lumière sur le trottoir : invisibles (et non dessinés) en journée.
export function NightGlow({ lamps }: { lamps: Item[] }) {
  const invalidate = useThree((s) => s.invalidate)
  const halos = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)
  const haloMat = useRef<MeshBasicMaterial>(null)
  const poolMat = useRef<MeshBasicMaterial>(null)
  const map = useMemo(() => glowTexture(), [])

  useLayoutEffect(() => {
    lamps.forEach((l, i) => {
      halos.current!.setMatrixAt(i, m.compose(v.set(l.p[0], l.p[1] + 1.36, l.p[2]), ID, s3.setScalar(0.3)))
      pools.current!.setMatrixAt(i, m.compose(v.set(l.p[0], l.p[1] + 0.006, l.p[2]), ID, s3.setScalar(1.5)))
    })
    halos.current!.instanceMatrix.needsUpdate = true
    pools.current!.instanceMatrix.needsUpdate = true
    invalidate()
  }, [lamps, invalidate])

  useFrame(() => {
    const night = nightAt(animStore.hours)
    const on = night > 0.02
    if (halos.current) halos.current.visible = on
    if (pools.current) pools.current.visible = on
    if (haloMat.current) haloMat.current.opacity = night * 0.7
    if (poolMat.current) poolMat.current.opacity = night * 1.0
  })

  return (
    <group>
      <instancedMesh ref={halos} args={[undefined, undefined, lamps.length]} frustumCulled={false} visible={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial ref={haloMat} color="#ffd98a" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, lamps.length]} frustumCulled={false} visible={false}>
        <planeGeometry args={[1, 1]} onUpdate={(g) => g.rotateX(-Math.PI / 2)} />
        <meshBasicMaterial ref={poolMat} map={map} color="#ffcf7a" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
