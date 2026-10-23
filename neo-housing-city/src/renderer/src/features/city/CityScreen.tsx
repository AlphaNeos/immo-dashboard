import { useEffect, useState } from 'react'
import { CityScene } from '@/modules/city/CityScene'
import { cameraStore } from '@/modules/city/cameraStore'
import { SceneBoundary } from '@/scene/SceneBoundary'

interface Stats { calls: number; triangles: number; geometries: number }

function StatsPanel() {
  const [s, setS] = useState<Stats | null>(null)
  useEffect(() => {
    const id = setInterval(() => setS((window as unknown as { __neoStats?: () => Stats }).__neoStats?.() ?? null), 500)
    return () => clearInterval(id)
  }, [])
  if (!s) return null
  return (
    <div className="hud__stats">
      {s.calls} appels graphiques · {(s.triangles / 1000).toFixed(1)}k triangles
    </div>
  )
}

export function CityScreen({ onExit }: { onExit: () => void }) {
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'F3' && setShowStats((v) => !v)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="city">
      <SceneBoundary>
        <CityScene />
      </SceneBoundary>

      <header className="hud__title">
        <span className="hud__logo">NEO <b>HOUSING</b> CITY</span>
        <button className="hud__link" onClick={onExit}>Accueil</button>
      </header>

      <nav className="hud__controls" aria-label="Caméra">
        <button title="Tourner à gauche (Q)" onClick={() => cameraStore.rotateStep(-1)}>⟲</button>
        <button title="Tourner à droite (E)" onClick={() => cameraStore.rotateStep(1)}>⟳</button>
        <span className="hud__sep" />
        <button title="Zoom + (+)" onClick={() => cameraStore.zoomBy(1.25)}>+</button>
        <button title="Zoom − (-)" onClick={() => cameraStore.zoomBy(0.8)}>−</button>
        <span className="hud__sep" />
        <button title="Recentrer (R)" onClick={() => cameraStore.reset()}>⌂</button>
      </nav>

      <p className="hud__hint">
        Glisser : déplacer · Molette / pincement : zoom · Q / E ou Maj + glisser : tourner · WASD / flèches · R : recentrer
      </p>
      {showStats && <StatsPanel />}
    </main>
  )
}
