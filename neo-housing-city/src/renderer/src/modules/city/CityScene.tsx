import { useEffect } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Vector3, type DirectionalLight, type HemisphereLight } from 'three'
import { animStore } from '../life/animStore'
import { lightingAt } from '../life/lighting'
import { nightUniform } from '../life/shaders'
import { lifeMs } from '../life/perf'
import { Ticker } from '../life/Ticker'
import { CameraRig } from './CameraRig'
import { CityWorld } from './CityWorld'

function Lighting({ refresh }: { refresh: unknown }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const sun = useRef<DirectionalLight>(null)
  const moon = useRef<DirectionalLight>(null)
  const hemi = useRef<HemisphereLight>(null)
  const applied = useRef(-1)

  // Le soleil est fixe : les ombres sont calculées une seule fois puis réutilisées (gros gain de performance).
  // La nuit, l'intensité du soleil tombe à 0 et les ombres disparaissent d'elles-mêmes.
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, invalidate, refresh])

  const apply = () => {
    const h = animStore.hours
    if (applied.current === h) return
    applied.current = h
    const L = lightingAt(h)
    if (sun.current) { sun.current.intensity = L.sunIntensity; sun.current.color.copy(L.sunColor) }
    if (moon.current) moon.current.intensity = L.moonIntensity
    if (hemi.current) { hemi.current.intensity = L.hemiIntensity; hemi.current.color.copy(L.hemiSky); hemi.current.groundColor.copy(L.hemiGround) }
    nightUniform.value = L.night
    const root = document.documentElement.style
    root.setProperty('--sky-top', `#${L.skyTop.getHexString()}`)
    root.setProperty('--sky-bottom', `#${L.skyBottom.getHexString()}`)
  }
  useLayoutEffect(() => { applied.current = -1; apply() })
  useFrame(apply)

  return (
    <>
      <hemisphereLight ref={hemi} args={['#cfe8ff', '#7a9a58', 1.1]} />
      <directionalLight
        ref={sun}
        position={[-22, 34, 16]}
        intensity={2.4}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={moon} position={[24, 30, -14]} intensity={0} color="#8fb0ff" />
    </>
  )
}

// Statistiques de rendu lisibles par l'interface (touche F3) et par les tests.
function StatsProbe() {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    // utilitaire de test : position écran (pixels) d'un point du monde
    ;(window as unknown as { __neoProject?: unknown }).__neoProject = (x: number, y: number, z: number) => {
      const v = new Vector3(x, y, z).project(camera)
      const r = gl.domElement.getBoundingClientRect()
      return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]
    }
    const w = window as unknown as { __neoStats?: () => unknown }
    w.__neoStats = () => ({
      calls: gl.info.render.calls,
      frame: gl.info.render.frame,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      lifeMs: lifeMs()
    })
    return () => { delete w.__neoStats }
  }, [gl, camera])
  return null
}

export function CityScene({ gallery = false }: { gallery?: boolean }) {
  return (
    <Canvas
      orthographic
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ near: 0.1, far: 300, zoom: 26, position: [60, 50, 60] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Ticker />
      <Lighting refresh={gallery} />
      <CityWorld gallery={gallery} />
      <CameraRig />
      <StatsProbe />
    </Canvas>
  )
}
