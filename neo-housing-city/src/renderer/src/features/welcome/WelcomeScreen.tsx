import { BackgroundScene } from '@/scene/BackgroundScene'
import { SceneBoundary } from '@/scene/SceneBoundary'

export function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const v = window.neo?.versions

  return (
    <main className="welcome">
      <div className="welcome__scene">
        <SceneBoundary>
          <BackgroundScene />
        </SceneBoundary>
      </div>
      <section className="welcome__content">
        <p className="welcome__tag">Simulation de gestion immobilière</p>
        <h1 className="welcome__title">
          NEO <span>HOUSING</span> CITY
        </h1>
        <p className="welcome__subtitle">Chaque bâtiment est un vrai logement.</p>
        <button className="welcome__button" onClick={onEnter}>
          Entrer dans la ville
        </button>
        <p className="welcome__version">
          v0.1.0 — étape 2 : la ville
          {v && ` · Electron ${v.electron} · Chromium ${v.chrome}`}
        </p>
      </section>
    </main>
  )
}
