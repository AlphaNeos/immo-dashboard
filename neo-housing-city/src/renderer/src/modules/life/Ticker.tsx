import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HOURS_PER_SECOND, animStore, useAnimEnabled } from './animStore'
import { windUniform } from './shaders'

// Horloge des animations. La scène ne se redessine QUE si les animations sont actives (ou si la caméra bouge) :
// bouton coupé = 0 % de processeur/GPU au repos. Cadence plafonnée à ~60 images/s, même sur écran 120 Hz.
export function Ticker() {
  const invalidate = useThree((s) => s.invalidate)
  const enabled = useAnimEnabled()
  const last = useRef(performance.now())

  useEffect(() => {
    animStore.wake = invalidate
    return () => { animStore.wake = () => {} }
  }, [invalidate])

  useEffect(() => { last.current = performance.now(); if (enabled) invalidate() }, [enabled, invalidate])

  useFrame((_, dt) => {
    if (!animStore.enabled) return
    // L'heure suit le temps réel (même si l'affichage ralentit) ; seules les simulations utilisent un pas plafonné.
    const now = performance.now()
    const real = Math.min((now - last.current) / 1000, 1)
    last.current = now
    animStore.hours = (animStore.hours + real * HOURS_PER_SECOND) % 24
    windUniform.value += Math.min(dt, 0.05)
    setTimeout(invalidate, 12)
  })
  return null
}
