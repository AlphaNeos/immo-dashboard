import { useEffect, useState } from 'react'
import { CityScene } from '@/modules/city/CityScene'
import { cameraStore } from '@/modules/city/cameraStore'
import { animStore, useAnimEnabled } from '@/modules/life/animStore'
import { formatHours, nightAt } from '@/modules/life/lighting'
import { SceneBoundary } from '@/scene/SceneBoundary'

interface Stats { calls: number; triangles: number; geometries: number; lifeMs: number }

function StatsPanel() {
  const [s, setS] = useState<Stats | null>(null)
  useEffect(() => {
    const id = setInterval(() => setS((window as unknown as { __neoStats?: () => Stats }).__neoStats?.() ?? null), 500)
    return () => clearInterval(id)
  }, [])
  if (!s) return null
  return (
    <div className="hud__stats">
      {s.calls} appels graphiques · {(s.triangles / 1000).toFixed(1)}k triangles · animations {s.lifeMs.toFixed(2)} ms/image
    </div>
  )
}

function TimeControl() {
  const [hours, setHours] = useState(animStore.hours)
  useEffect(() => {
    const id = setInterval(() => setHours(animStore.hours), 250)
    return () => clearInterval(id)
  }, [])
  const night = nightAt(hours) > 0.5
  return (
    <label className="hud__time" title="Heure de la journée">
      <span aria-hidden>{night ? '☾' : '☀'}</span>
      <input
        type="range" min={0} max={24} step={0.1} value={hours}
        onChange={(e) => { setHours(+e.target.value); animStore.setHours(+e.target.value) }}
      />
      <b>{formatHours(hours)}</b>
    </label>
  )
}

export function CityScreen({ onExit }: { onExit: () => void }) {
  const [showStats, setShowStats] = useState(false)
  const [gallery, setGallery] = useState(false)
  const animOn = useAnimEnabled()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F3') setShowStats((v) => !v)
      if (e.key === 'F4') setGallery((v) => !v)
      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey) animStore.setEnabled(!animStore.enabled)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="city">
      <SceneBoundary>
        <CityScene gallery={gallery} />
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
        <TimeControl />
        <button
          className={animOn ? 'hud__toggle is-on' : 'hud__toggle'} aria-pressed={animOn}
          title="Activer / désactiver les animations (P)" onClick={() => animStore.setEnabled(!animOn)}
        >
          {animOn ? '⏸ Animations' : '▶ Animations'}
        </button>
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
