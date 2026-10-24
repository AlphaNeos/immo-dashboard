import { useSyncExternalStore } from 'react'
import { selection } from '../housing/selection'
import { cameraStore } from '../city/cameraStore'

// Visite guidée : la caméra passe d'un logement à l'autre et ouvre sa fiche.
const STEP_MS = 5000
let state = { running: false, index: 0, ids: [] as string[] }
let timer: ReturnType<typeof setTimeout> | null = null
let current: string | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function show() {
  current = state.ids[state.index]
  selection.select(current)
  selection.onSelect?.(current)
  timer = setTimeout(() => {
    if (!state.running) return
    if (state.index + 1 >= state.ids.length) return tour.stop(true)
    state = { ...state, index: state.index + 1 }
    emit()
    show()
  }, STEP_MS)
}

// si l'utilisateur ferme la fiche ou choisit un autre bâtiment, la visite s'arrête
selection.subscribe(() => {
  if (state.running && selection.get().selectedId !== current) tour.stop(false)
})

export const tour = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  start(ids: string[]) {
    if (!ids.length) return
    if (timer) clearTimeout(timer)
    state = { running: true, index: 0, ids }
    emit()
    show()
  },
  stop(backToOverview = true) {
    if (timer) clearTimeout(timer)
    timer = null
    const wasRunning = state.running
    state = { ...state, running: false }
    current = null
    emit()
    if (wasRunning && backToOverview) { selection.select(null); cameraStore.reset() }
  }
}
export const useTour = () => useSyncExternalStore(tour.subscribe, tour.get)
