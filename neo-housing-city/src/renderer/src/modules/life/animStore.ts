import { useSyncExternalStore } from 'react'

// État partagé des animations : bouton ON/OFF et heure de la journée (0-24 h).
const KEY = 'neo.animations'

function load(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

let state = { enabled: load() }
const listeners = new Set<() => void>()

// La ville reste en plein jour : l'heure est fixe (11 h) et ne change jamais.
export const DAY_HOURS = 11

export const animStore = {
  hours: DAY_HOURS,
  wake: (() => {}) as () => void,
  get enabled() { return state.enabled },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  setEnabled(v: boolean) {
    state = { enabled: v }
    try { localStorage.setItem(KEY, v ? 'on' : 'off') } catch { /* stockage indisponible : sans importance */ }
    listeners.forEach((l) => l())
    this.wake()
  }
}

export function useAnimEnabled(): boolean {
  return useSyncExternalStore(animStore.subscribe, () => state.enabled)
}
