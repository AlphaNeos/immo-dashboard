import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import type { Group, MeshLambertMaterial, MeshStandardMaterial } from 'three'
import { glassKey, patchGlass } from '../life/shaders'
import { getModelGeometry } from './models'
import { loadRealistic, type RealModel } from './realistic'
import type { BuildingModelId } from './types'

interface Props {
  buildingId?: string // si un modèle réaliste existe pour ce bâtiment, il remplace la maquette
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
export function BuildingMesh({ buildingId, model, x, y, z, rotationY, hovered, selected, onHover, onSelect }: Props) {
  const geo = useMemo(() => getModelGeometry(model), [model])
  const group = useRef<Group>(null)
  const mat = useRef<MeshStandardMaterial | MeshLambertMaterial>(null)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const bounce = useRef(0)
  const interactive = !!onSelect
  const [real, setReal] = useState<RealModel | null>(null)

  // Modèle réaliste : chargé en arrière-plan ; la maquette reste affichée en attendant.
  useEffect(() => {
    if (!buildingId) return
    let alive = true
    loadRealistic(buildingId)?.then((m) => {
      if (!alive) return
      setReal(m)
      gl.shadowMap.needsUpdate = true // les ombres (calculées une seule fois) doivent intégrer le nouveau modèle
      invalidate()
    })
    return () => { alive = false }
  }, [buildingId, gl, invalidate])

  useEffect(() => {
    if (mat.current) {
      mat.current.emissive.set('#ffffff')
      // modèle réaliste : sa texture contient déjà l'éclairage, on la fait légèrement « rayonner » pour garder des couleurs vives
      const base = real ? 0.35 : 0
      mat.current.emissiveIntensity = base + (selected ? 0.16 : hovered ? 0.12 : 0)
    }
    invalidate()
  }, [hovered, selected, real, invalidate])

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
      {real ? (
        <mesh geometry={real.geometry} castShadow receiveShadow>
          <meshLambertMaterial ref={mat as React.Ref<MeshLambertMaterial>} map={real.texture} emissiveMap={real.texture} emissive="#ffffff" emissiveIntensity={0.35} />
        </mesh>
      ) : (
        <mesh geometry={geo.body} castShadow receiveShadow>
          <meshStandardMaterial ref={mat} vertexColors roughness={0.85} />
        </mesh>
      )}
      {!real && geo.glass && (
        <mesh geometry={geo.glass}>
          <meshStandardMaterial vertexColors roughness={0.15} color="#ffffff" emissive="#2d5d78" emissiveIntensity={0.3} onBeforeCompile={patchGlass} customProgramCacheKey={glassKey} />
        </mesh>
      )}
    </group>
  )
}
