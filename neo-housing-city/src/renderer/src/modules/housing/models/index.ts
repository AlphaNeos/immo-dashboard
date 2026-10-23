import type { BufferGeometry } from 'three'
import type { BuildingModelId } from '../types'
import { Builder } from './builder'
import { apartmentBlock } from './apartmentBlock'
import { classic } from './classic'
import { modernVilla } from './modernVilla'
import { renovation } from './renovation'
import { studio } from './studio'
import { upperFloor } from './upperFloor'

const makers: Record<BuildingModelId, (b: Builder) => void> = {
  classic, 'upper-floor': upperFloor, 'modern-villa': modernVilla, 'apartment-block': apartmentBlock, studio, renovation
}

const cache = new Map<BuildingModelId, { body: BufferGeometry; glass: BufferGeometry | null }>()

// Géométries fusionnées d'un modèle (créées une seule fois, partagées entre tous les bâtiments du même type).
export function getModelGeometry(id: BuildingModelId) {
  let m = cache.get(id)
  if (!m) {
    const b = new Builder()
    makers[id](b)
    m = b.build()
    cache.set(id, m)
  }
  return m
}
