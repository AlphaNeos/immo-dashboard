import type { BufferGeometry } from 'three'
import { Builder } from './builder'
import { padel, playground, pool } from './leisure'
import { bakery, cafe, cottage, modernCube, residence, townhouses } from './neighbors'

export type DecorModelId = 'townhouses' | 'cafe' | 'bakery' | 'cottage' | 'modern-cube' | 'residence' | 'padel' | 'pool' | 'playground'

const makers: Record<DecorModelId, (b: Builder, v: number) => void> = {
  townhouses, cafe: (b) => cafe(b), bakery: (b) => bakery(b), cottage, 'modern-cube': modernCube, residence,
  padel: (b) => padel(b), pool: (b) => pool(b), playground: (b) => playground(b)
}

export const DECOR_LABELS: Record<DecorModelId, string> = {
  townhouses: 'Maisons mitoyennes', cafe: 'Café du centre', bakery: 'Boulangerie', cottage: 'Cottage', 'modern-cube': 'Maison moderne',
  residence: 'Résidence', padel: 'Club de padel', pool: 'Piscine municipale', playground: 'Aire de jeux et basket'
}

const cache = new Map<string, { body: BufferGeometry; glass: BufferGeometry | null }>()
export function getDecorGeometry(id: DecorModelId, variant = 0) {
  const key = `${id}:${variant}`
  let m = cache.get(key)
  if (!m) {
    const b = new Builder()
    makers[id](b, variant)
    m = b.build()
    cache.set(key, m)
  }
  return m
}
