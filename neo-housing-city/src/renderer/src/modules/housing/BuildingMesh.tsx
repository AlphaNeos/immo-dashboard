import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group, MeshStandardMaterial } from 'three'
import { glassKey, patchGlass } from '../life/shaders'
import { getModelGeometry } from './models'
import type { BuildingModelId } from './types'

interface Props {
  model: BuildingModelId
  x: number
  y: number // hauteur de la surface de la parcelle
  z: number
  rotationY: number
  hovered?: boolean
  selected?: boolean
  onHover?: (over: boolean) => void
  onSelect?: () => void
}

// Un bâtiment = 2 maillages (murs + vitres) = 2 appels graphiques.
// Survol : léger éclairage ; sélection : petit rebond puis éclairage constant.
export function BuildingMesh({ model, x, y, z, rotationY, hovered, selected, onHover, onSelect }: Props) {
  const geo = useMemo(() => getModelGeometry(model), [model])
  const group = useRef<Group>(null)
  const mat = useRef<MeshStandardMaterial>(null)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const bounce = useRef(0)
  const interactive = !!onSelect

  useEffect(() => {
    if (mat.current) {
      mat.current.emissive.set('#ffffff')
      mat.current.emissiveIntensity = selected ? 0.16 : hovered ? 0.12 : 0
    }
    invalidate()
  }, [hovered, selected, invalidate])

  useEffect(() => {
    if (selected) { bounce.current = 1; invalidate() }
  }, [selected, invalidate])

  useEffect(() => () => { gl.domElement.style.cursor = 'grab' }, [gl])

  useFrame((_, dt) => {
    if (!group.current || bounce.current <= 0) return
    bounce.current = Math.max(0, bounce.current - dt * 2.2)
    const t = 1 - bounce.current
    group.current.position.y = y + Math.sin(t * Math.PI) * 0.09 // petit saut
    group.current.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.025)
    if (bounce.current === 0) { group.current.position.y = y; group.current.scale.setScalar(1) }
    invalidate()
  })

  const handlers = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover?.(true); gl.domElement.style.cursor = 'pointer' },
        onPointerOut: () => { onHover?.(false); gl.domElement.style.cursor = 'grab' },
        // un glissement de la souris (déplacement de la caméra) n'est pas un clic
        onClick: (e: ThreeEvent<MouseEvent>) => { if (e.delta < 5) { e.stopPropagation(); onSelect?.() } }
      }
    : {}

  return (
    <group ref={group} position={[x, y, z]} rotation={[0, rotationY, 0]} {...handlers}>
      <mesh geometry={geo.body} castShadow receiveShadow>
        <meshStandardMaterial ref={mat} vertexColors roughness={0.85} />
      </mesh>
      {geo.glass && (
        <mesh geometry={geo.glass}>
          <meshStandardMaterial vertexColors roughness={0.15} color="#ffffff" emissive="#2d5d78" emissiveIntensity={0.3} onBeforeCompile={patchGlass} customProgramCacheKey={glassKey} />
        </mesh>
      )}
    </group>
  )
}
