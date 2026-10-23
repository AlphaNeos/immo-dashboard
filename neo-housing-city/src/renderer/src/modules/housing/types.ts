// Modèle de données « bâtiments » : prépare le lien futur avec les logements réels.
//
//   Plot (parcelle)  1 ── 0..1  Building (bâtiment 3D, un seul objet physique)
//   Building         1 ── 1..n  Dwelling (logement : maison = 1, immeuble de rapport = 3)
//
// Un Dwelling ne porte volontairement aucune donnée financière : `externalRef` servira plus tard
// à le relier à la fiche du logement réel (base de données).

export type BuildingModelId =
  | 'classic'
  | 'upper-floor'
  | 'modern-villa'
  | 'apartment-block'
  | 'studio'
  | 'renovation'

export interface BuildingModelInfo {
  id: BuildingModelId
  label: string
  floors: number
  defaultDwellings: number
}

export const BUILDING_MODELS: Record<BuildingModelId, BuildingModelInfo> = {
  classic: { id: 'classic', label: 'Maison classique', floors: 1, defaultDwellings: 1 },
  'upper-floor': { id: 'upper-floor', label: 'Maison bel étage', floors: 2, defaultDwellings: 1 },
  'modern-villa': { id: 'modern-villa', label: 'Villa moderne', floors: 2, defaultDwellings: 1 },
  'apartment-block': { id: 'apartment-block', label: "Immeuble de rapport", floors: 3, defaultDwellings: 3 },
  studio: { id: 'studio', label: 'Studio', floors: 1, defaultDwellings: 1 },
  renovation: { id: 'renovation', label: 'Maison en rénovation', floors: 1, defaultDwellings: 1 }
}

export interface Dwelling {
  id: string // ex. « bld-004-u2 »
  buildingId: string
  label: string // ex. « Appartement 2 »
  floor: number // 0 = rez-de-chaussée
  externalRef: string | null // lien futur vers le logement réel (base de données)
}

export interface Building {
  id: string // unique, stable, ex. « bld-001 »
  name: string
  model: BuildingModelId
  plotId: string
  position: { x: number; z: number } // centre de la parcelle (monde 3D)
  rotationY: number // 0 = façade vers +z
  dwellings: Dwelling[]
}
