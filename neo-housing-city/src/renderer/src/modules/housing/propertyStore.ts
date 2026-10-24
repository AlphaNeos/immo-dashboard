import { useSyncExternalStore } from 'react'
import { SEED_PROPERTIES, validateEditable, type Editable, type Property } from './properties'

// Fiches des logements : valeurs de départ + modifications de l'utilisateur.
// Les modifications sont enregistrées localement (stockage du navigateur / de l'application) en attendant la base SQLite.
const KEY = 'neo.properties.v1'

type Overrides = Record<string, Editable>

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as Overrides
    const clean: Overrides = {}
    for (const p of SEED_PROPERTIES) {
      const o = data?.[p.buildingId]
      if (o && typeof o === 'object' && Object.keys(validateEditable(o)).length === 0) clean[p.buildingId] = o // tout ce qui est invalide est ignoré
    }
    return clean
  } catch {
    return {}
  }
}

let overrides: Overrides = loadOverrides()
let snapshot = compute()
const listeners = new Set<() => void>()

function merge(seed: Property, o?: Editable): Property {
  if (!o) return seed
  const studios = seed.studios?.map((s) => ({ ...s, ...(o.studios?.find((x) => x.id === s.id) ?? {}) }))
  return { ...seed, ...o, studios }
}
function compute(): Property[] {
  return SEED_PROPERTIES.map((p) => merge(p, overrides[p.buildingId]))
}
function emit() {
  snapshot = compute()
  listeners.forEach((l) => l())
}

export const propertyStore = {
  get all() { return snapshot },
  get(id: string) { return snapshot.find((p) => p.buildingId === id) },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  /** Enregistre une modification. Retourne les erreurs de validation (vide = enregistré). */
  update(id: string, patch: Editable): Record<string, string> {
    const next = { ...overrides[id], ...patch }
    const errors = validateEditable(next)
    if (Object.keys(errors).length) return errors
    overrides = { ...overrides, [id]: next }
    try { localStorage.setItem(KEY, JSON.stringify(overrides)) } catch { /* stockage indisponible */ }
    emit()
    return {}
  },
  /** Revient aux valeurs de départ pour un logement (demande de confirmation côté interface). */
  reset(id: string) {
    const { [id]: _removed, ...rest } = overrides
    overrides = rest
    try { localStorage.setItem(KEY, JSON.stringify(overrides)) } catch { /* idem */ }
    emit()
  },
  isModified: (id: string) => id in overrides
}

export function useProperties(): Property[] {
  return useSyncExternalStore(propertyStore.subscribe, () => snapshot)
}
