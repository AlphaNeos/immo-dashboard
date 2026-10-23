import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HOURS_PER_SECOND, animStore, useAnimEnabled } from './animStore'
import { windUniform } from './shaders'

// Horloge des animations. La scène ne se redessine QUE si les animations sont actives (ou si la caméra bouge) :
// bouton coupé = 0 % de processeur/GPU au repos. Cadence plafonnée à ~60 images/s, même sur écran 120 Hz.
export function Ticker() {
  const invalidate = useThree((s) => s.invalidate)
  const enabled = useAnimEnabled()

  useEffect(() => {
    animStore.wake = invalidate
    return () => { animStore.wake = () => {} }
  }, [invalidate])

  useEffect(() => { if (enabled) invalidate() }, [enabled, invalidate])

  useFrame((_, dt) => {
    if (!animStore.enabled) return
    const d = Math.min(dt, 0.05)
    animStore.hours = (animStore.hours + d * HOURS_PER_SECOND) % 24
    windUniform.value += d
    setTimeout(invalidate, 12)
  })
  return null
}
