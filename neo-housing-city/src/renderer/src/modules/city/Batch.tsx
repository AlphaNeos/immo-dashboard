import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { Color, Object3D, type InstancedMesh } from 'three'
import type { Item } from './layout'

const dummy = new Object3D()
const color = new Color()

interface Props {
  items: Item[]
  cast?: boolean
  receive?: boolean
  children: ReactNode // <xxxGeometry/> + <material/>
}

// Dessine N objets identiques en UN seul appel graphique (instancing) :
// c'est ce qui garde la scène fluide même avec des centaines d'arbres.
export function Batch({ items, cast = false, receive = false, children }: Props) {
  const ref = useRef<InstancedMesh>(null)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const colored = items.some((i) => i.c)
    items.forEach((it, i) => {
      dummy.position.set(...it.p)
      dummy.rotation.set(0, it.ry ?? 0, 0)
      const s = it.s ?? 1
      if (typeof s === 'number') dummy.scale.setScalar(s)
      else dummy.scale.set(...s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      if (colored) mesh.setColorAt(i, color.set(it.c ?? '#ffffff'))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }, [items, invalidate])

  if (items.length === 0) return null
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={cast}
      receiveShadow={receive}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  )
}
