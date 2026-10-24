import { useEffect, useState } from 'react'
import { CityScene } from '@/modules/city/CityScene'
import { cameraStore } from '@/modules/city/cameraStore'
import { animStore, useAnimEnabled } from '@/modules/life/animStore'
import { SceneBoundary } from '@/scene/SceneBoundary'
import { checkProgress } from '@/modules/game/celebrate'
import { ranking } from '@/modules/game/progress'
import { tour, useTour } from '@/modules/game/tour'
import { useProperties } from '@/modules/housing/propertyStore'
import { Confetti, fireConfetti } from './Confetti'
import { GamePanel } from './GamePanel'
import { HoverTooltip } from './HoverTooltip'
import { Toasts, toast } from './Toasts'
import { PortfolioBar } from './PortfolioBar'
import { PropertyPanel } from './PropertyPanel'

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

export function CityScreen({ onExit }: { onExit: () => void }) {
  const [showStats, setShowStats] = useState(false)
  const [gallery, setGallery] = useState(false)
  const animOn = useAnimEnabled()
  const props = useProperties()
  const tourState = useTour()

  // Célébrations : trophée, objectif ou niveau nouvellement atteint
  useEffect(() => {
    const events = checkProgress(props)
    events.forEach((e, i) => setTimeout(() => {
      toast(e)
      fireConfetti(window.innerWidth / 2, window.innerHeight / 3, e.kind === 'level' ? 220 : 120)
    }, i * 700))
  }, [props])
  useEffect(() => () => tour.stop(false), [])

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

      <header className={window.neo ? 'hud__title' : 'hud__title hud__title--web'}>
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
        <button
          className={tourState.running ? 'hud__toggle is-on' : 'hud__toggle'}
          title="Visite guidée des logements, du plus rentable au moins rentable"
          onClick={() => (tourState.running ? tour.stop() : tour.start(ranking(props).map((r) => r.p.buildingId)))}
        >
          {tourState.running ? `■ Visite ${tourState.index + 1}/${tourState.ids.length}` : '▶ Visite guidée'}
        </button>
        <button
          className={animOn ? 'hud__toggle hud__anim is-on' : 'hud__toggle hud__anim'} aria-pressed={animOn}
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
      <PortfolioBar />
      <GamePanel />
      <Toasts />
      <Confetti />
      <PropertyPanel />
      <HoverTooltip />
      {showStats && <StatsPanel />}
    </main>
  )
}
