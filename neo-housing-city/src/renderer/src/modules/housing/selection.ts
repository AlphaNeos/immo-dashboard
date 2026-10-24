import { useSyncExternalStore } from 'react'

// Survol et sélection des bâtiments (partagés entre la scène 3D et l'interface).
interface State { hoveredId: string | null; selectedId: string | null; studioId: string | null }
let state: State = { hoveredId: null, selectedId: null, studioId: null }
const listeners = new Set<() => void>()
const set = (s: Partial<State>) => {
  state = { ...state, ...s }
  listeners.forEach((l) => l())
}

export const selection = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  hover: (id: string | null) => { if (state.hoveredId !== id) set({ hoveredId: id }) },
  select: (id: string | null) => set({ selectedId: id, studioId: null }),
  selectStudio: (studioId: string | null) => set({ studioId }),
  onSelect: null as null | ((id: string | null) => void)
}

export function useSelection(): State {
  return useSyncExternalStore(selection.subscribe, selection.get)
}
