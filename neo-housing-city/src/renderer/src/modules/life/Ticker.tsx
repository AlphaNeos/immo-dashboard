import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { animStore, useAnimEnabled } from './animStore'
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
    windUniform.value += Math.min(dt, 0.05)
    setTimeout(invalidate, 12)
  })
  return null
}
