import type { Plot } from '../city/layout'
import type { DecorModelId } from './models/decor'

// Ce qui occupe les parcelles qui ne sont PAS à vous : voisins, commerces et loisirs (décor uniquement).
export interface DecorBuilding { plotId: string; model: DecorModelId; variant: number; facing?: number }

export const NEIGHBORHOOD: DecorBuilding[] = [
  // commerces : vitrines tournées vers la rue de droite (+x), bien visibles depuis la caméra
  { plotId: 'plot-14', model: 'cafe', variant: 0, facing: Math.PI / 2 },
  { plotId: 'plot-10', model: 'bakery', variant: 0, facing: Math.PI / 2 },
  { plotId: 'plot-13', model: 'residence', variant: 1 },
  { plotId: 'plot-01', model: 'townhouses', variant: 0 },
  { plotId: 'plot-02', model: 'cottage', variant: 0 },
  { plotId: 'plot-05', model: 'modern-cube', variant: 0 },
  { plotId: 'plot-07', model: 'residence', variant: 0 },
  { plotId: 'plot-17', model: 'townhouses', variant: 1 },
  { plotId: 'plot-22', model: 'cottage', variant: 1 },
  { plotId: 'plot-23', model: 'modern-cube', variant: 1 },
  { plotId: 'plot-ext-1', model: 'padel', variant: 0 },
  { plotId: 'plot-ext-2', model: 'pool', variant: 0 },
  { plotId: 'plot-ext-3', model: 'playground', variant: 0 }
]

export const plotOf = (plots: Plot[], id: string) => plots.find((p) => p.id === id)
