import type { Plot } from '../city/layout'
import { BUILDING_MODELS, type Building, type BuildingModelId, type Dwelling } from './types'

interface BuildingSeed {
  id: string
  name: string
  model: BuildingModelId
  plotId: string
  dwellings?: { label: string; floor: number }[]
}

// Bâtiments présents au démarrage. Plus tard, cette liste viendra de la base de données.
export const INITIAL_BUILDINGS: BuildingSeed[] = [
  { id: 'bld-001', name: 'Maison 4 chambres — Rue du Fisch Club 41', model: 'classic', plotId: 'plot-11' },
  { id: 'bld-002', name: 'Maison 4 chambres — Rue de Frameries 238', model: 'upper-floor', plotId: 'plot-19' },
  {
    id: 'bld-003',
    name: 'Immeuble 3 studios — Rue Antoine Clesse 27',
    model: 'apartment-block',
    plotId: 'plot-16',
    dwellings: [
      { label: 'Studio 1', floor: 0 },
      { label: 'Studio 2', floor: 1 },
      { label: 'Studio 3', floor: 2 }
    ]
  },
  { id: 'bld-004', name: 'Appartement 1 chambre — Rue Émile Vandervelde 25', model: 'studio', plotId: 'plot-20' },
  { id: 'bld-005', name: "Maison A — Avenue de l'Hôpital 43", model: 'modern-villa', plotId: 'plot-04' },
  { id: 'bld-006', name: 'Maison B — Rue de la Joyeuse Entrée 27', model: 'classic', plotId: 'plot-08' }
]

export function createBuildings(plots: Plot[], seeds: BuildingSeed[] = INITIAL_BUILDINGS): Building[] {
  return seeds.map((seed) => {
    const plot = plots.find((p) => p.id === seed.plotId)
    if (!plot) throw new Error(`Parcelle introuvable : ${seed.plotId}`)
    const dw = seed.dwellings ?? [{ label: 'Logement', floor: 0 }]
    const dwellings: Dwelling[] = dw.map((d, i) => ({
      id: `${seed.id}-u${i + 1}`,
      buildingId: seed.id,
      label: d.label,
      floor: d.floor,
      externalRef: null
    }))
    return { id: seed.id, name: seed.name, model: seed.model, plotId: plot.id, position: { x: plot.x, z: plot.z }, rotationY: plot.facing, dwellings }
  })
}

// Contrôles d'intégrité : retourne la liste des problèmes (vide = tout est cohérent).
export function validateBuildings(buildings: Building[], plots: Plot[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const plotsUsed = new Set<string>()
  const dwellingIds = new Set<string>()
  for (const b of buildings) {
    if (ids.has(b.id)) errors.push(`id de bâtiment en double : ${b.id}`)
    ids.add(b.id)
    if (plotsUsed.has(b.plotId)) errors.push(`parcelle utilisée deux fois : ${b.plotId}`)
    plotsUsed.add(b.plotId)
    const plot = plots.find((p) => p.id === b.plotId)
    if (!plot) errors.push(`${b.id} : parcelle inconnue ${b.plotId}`)
    else if (plot.kind !== 'buildable') errors.push(`${b.id} : la parcelle ${plot.id} n'est pas constructible`)
    else if (plot.x !== b.position.x || plot.z !== b.position.z) errors.push(`${b.id} : position différente de celle de la parcelle`)
    if (b.dwellings.length !== BUILDING_MODELS[b.model].defaultDwellings) errors.push(`${b.id} : nombre de logements inattendu pour ${b.model}`)
    for (const d of b.dwellings) {
      if (dwellingIds.has(d.id)) errors.push(`id de logement en double : ${d.id}`)
      dwellingIds.add(d.id)
      if (d.buildingId !== b.id) errors.push(`${d.id} : rattaché au mauvais bâtiment`)
    }
  }
  return errors
}
