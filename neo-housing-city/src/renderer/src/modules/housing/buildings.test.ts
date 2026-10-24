import { describe, expect, it } from 'vitest'
import { buildCity } from '../city/layout'
import { INITIAL_BUILDINGS, createBuildings, validateBuildings } from './buildings'
import { getModelGeometry } from './models'
import { BUILDING_MODELS, type BuildingModelId } from './types'

const { plots } = buildCity()

describe('bâtiments', () => {
  const buildings = createBuildings(plots)

  it('place les 6 logements gérés, dont 1 seul immeuble', () => {
    expect(buildings).toHaveLength(6)
    expect(buildings.filter((b) => b.model === 'apartment-block')).toHaveLength(1)
  })
  it('est cohérent (ids uniques, parcelles constructibles, positions)', () => {
    expect(validateBuildings(buildings, plots)).toEqual([])
  })
  it("l'immeuble est UN bâtiment avec 3 logements distincts", () => {
    const block = buildings.find((b) => b.model === 'apartment-block')!
    expect(block.dwellings.map((d) => d.id)).toEqual(['bld-003-u1', 'bld-003-u2', 'bld-003-u3'])
    expect(block.dwellings.every((d) => d.buildingId === block.id && d.externalRef === null)).toBe(true)
  })
  it('chaque maison a exactement 1 logement', () => {
    for (const b of buildings.filter((x) => x.model !== 'apartment-block')) expect(b.dwellings).toHaveLength(1)
  })
  it('détecte les doublons et les parcelles occupées deux fois', () => {
    const dup = createBuildings(plots, [...INITIAL_BUILDINGS, { ...INITIAL_BUILDINGS[0] }])
    const errs = validateBuildings(dup, plots)
    expect(errs.some((e) => e.includes('en double'))).toBe(true)
    expect(errs.some((e) => e.includes('parcelle utilisée deux fois'))).toBe(true)
  })
  it("refuse une parcelle qui n'est pas constructible", () => {
    const park = plots.find((p) => p.kind === 'park')!
    const errs = validateBuildings(createBuildings(plots, [{ id: 'x', name: 'x', model: 'classic', plotId: park.id }]), plots)
    expect(errs.join()).toContain("n'est pas constructible")
  })
})

describe('modèles 3D', () => {
  for (const id of Object.keys(BUILDING_MODELS) as BuildingModelId[]) {
    it(`${id} : géométrie valide, contenue dans la parcelle (3,2 x 3,2)`, () => {
      const { body, glass } = getModelGeometry(id)
      body.computeBoundingBox()
      const bb = body.boundingBox!
      expect(body.attributes.position.count).toBeGreaterThan(100)
      expect(body.attributes.position.array.every((v) => Number.isFinite(v))).toBe(true)
      expect(bb.min.x).toBeGreaterThanOrEqual(-1.6)
      expect(bb.max.x).toBeLessThanOrEqual(1.6)
      expect(bb.min.z).toBeGreaterThanOrEqual(-1.6)
      expect(bb.max.z).toBeLessThanOrEqual(1.6)
      expect(glass).not.toBeNull()
    })
  }
})
