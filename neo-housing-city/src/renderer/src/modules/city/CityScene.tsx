import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CameraRig } from './CameraRig'
import { CityWorld } from './CityWorld'

function Lighting() {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  // Le soleil est fixe : les ombres sont calculées une seule fois puis réutilisées (gros gain de performance).
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
  }, [gl, invalidate])

  return (
    <>
      <hemisphereLight args={['#cfe8ff', '#7a9a58', 1.1]} />
      <directionalLight
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
    </>
  )
}

// Statistiques de rendu lisibles par l'interface (touche F3) et par les tests.
function StatsProbe() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const w = window as unknown as { __neoStats?: () => unknown }
    w.__neoStats = () => ({
      calls: gl.info.render.calls,
      frame: gl.info.render.frame,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries
    })
    return () => { delete w.__neoStats }
  }, [gl])
  return null
}

export function CityScene() {
  return (
    <Canvas
      orthographic
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ near: 0.1, far: 300, zoom: 26, position: [60, 50, 60] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Lighting />
      <CityWorld />
      <CameraRig />
      <StatsProbe />
    </Canvas>
  )
}
