import { useState } from 'react'
import { CityScreen } from '@/features/city/CityScreen'
import { WelcomeScreen } from '@/features/welcome/WelcomeScreen'

// Point d'entrée de l'interface : accueil <-> ville.
export function App() {
  const [screen, setScreen] = useState<'welcome' | 'city'>('welcome')
  return screen === 'welcome' ? (
    <WelcomeScreen onEnter={() => setScreen('city')} />
  ) : (
    <CityScreen onExit={() => setScreen('welcome')} />
  )
}
