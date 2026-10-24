import { useSyncExternalStore } from 'react'

// État partagé des animations : bouton ON/OFF et heure de la journée (0-24 h).
const KEY = 'neo.animations'

function load(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

let state = { enabled: load() }
const listeners = new Set<() => void>()

export const HOURS_PER_SECOND = 24 / 120 // une journée complète = 2 minutes (la nuit tombe ~50 s après le lancement)

export const animStore = {
  hours: 9.5,
  wake: (() => {}) as () => void,
  get enabled() { return state.enabled },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  setEnabled(v: boolean) {
    state = { enabled: v }
    try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* stockage indisponible : sans importance */ }
    listeners.forEach((l) => l())
    this.wake()
  },
  setHours(h: number) {
    this.hours = ((h % 24) + 24) % 24
    this.wake()
  }
}

export function useAnimEnabled(): boolean {
  return useSyncExternalStore(animStore.subscribe, () => state.enabled)
}
