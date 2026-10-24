import { useSyncExternalStore } from 'react'
import type { Property } from '../housing/properties'

// Simulateur « Et si… » : un prix facturé fictif, affiché en direct (repère 3D compris) mais jamais enregistré
// tant que l'utilisateur ne clique pas sur « Appliquer ».
type Preview = { id: string; billed: number } | null
let preview: Preview = null
const listeners = new Set<() => void>()

export const simulate = {
  get: () => preview,
  set(p: Preview) { preview = p; listeners.forEach((l) => l()) },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
}
export const useSimPreview = () => useSyncExternalStore(simulate.subscribe, simulate.get)
export const withPreview = (p: Property, pv: Preview): Property => (pv && pv.id === p.buildingId ? { ...p, billed: pv.billed } : p)
