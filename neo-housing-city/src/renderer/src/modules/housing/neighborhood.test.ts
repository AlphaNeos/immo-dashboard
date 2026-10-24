import { describe, expect, it } from 'vitest'
import { buildCity } from '../city/layout'
import { INITIAL_BUILDINGS } from './buildings'
import { getDecorGeometry, type DecorModelId } from './models/decor'
import { NEIGHBORHOOD } from './neighborhood'
import { SEED_PROPERTIES, portfolio } from './properties'

const { plots } = buildCity()

describe('petite ville : voisins et loisirs', () => {
  it('plus aucun terrain vide : chaque parcelle constructible est occupée une seule fois', () => {
    const used = [...INITIAL_BUILDINGS.map((b) => b.plotId), ...NEIGHBORHOOD.map((d) => d.plotId)]
    expect(new Set(used).size).toBe(used.length)
    const buildable = plots.filter((p) => p.kind === 'buildable').map((p) => p.id).sort()
    expect([...used].sort()).toEqual(buildable)
  })
  it('padel et piscine présents sur les grands terrains', () => {
    const big = (m: DecorModelId) => plots.find((p) => p.id === NEIGHBORHOOD.find((d) => d.model === m)!.plotId)!
    expect(big('padel').size).toBe(6)
    expect(big('pool').size).toBe(6)
  })
  it('les voisins ne changent ni vos logements ni vos chiffres', () => {
    expect(SEED_PROPERTIES).toHaveLength(6)
    expect(portfolio(SEED_PROPERTIES).margin).toBe(10138.79)
    expect(NEIGHBORHOOD.some((d) => INITIAL_BUILDINGS.some((b) => b.plotId === d.plotId))).toBe(false)
  })
  for (const d of NEIGHBORHOOD) {
    it(`${d.model} (${d.plotId}) : géométrie valide et contenue dans sa parcelle`, () => {
      const size = plots.find((p) => p.id === d.plotId)!.size
      const { body } = getDecorGeometry(d.model, d.variant)
      body.computeBoundingBox()
      const bb = body.boundingBox!
      expect(Array.from(body.attributes.position.array).every(Number.isFinite)).toBe(true)
      expect(bb.min.x).toBeGreaterThanOrEqual(-size / 2 - 0.05)
      expect(bb.max.x).toBeLessThanOrEqual(size / 2 + 0.05)
      expect(bb.min.z).toBeGreaterThanOrEqual(-size / 2 - 0.05)
      expect(bb.max.z).toBeLessThanOrEqual(size / 2 + 0.05)
    })
  }
})
