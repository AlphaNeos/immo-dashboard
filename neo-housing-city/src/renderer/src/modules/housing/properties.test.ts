import { describe, expect, it } from 'vitest'
import { INITIAL_BUILDINGS } from './buildings'
import { SEED_PROPERTIES, finance, health, portfolio, validateEditable } from './properties'

const byAddr = (a: string) => SEED_PROPERTIES.find((p) => p.address.includes(a))!

describe('chiffres des 6 logements (tableau fourni)', () => {
  const expected: [string, number, number, number][] = [
    ['Fisch Club 41', 4628.79, 2600, 2028.79],
    ['Frameries 238', 4300, 2050, 2250],
    ['Antoine Clesse 27', 4300, 3250, 1050],
    ['Vandervelde 25', 1350, 1190, 160],
    ["Hôpital 43", 5000, 2350, 2650],
    ['Joyeuse Entrée 27', 5200, 3200, 2000]
  ]
  for (const [addr, billed, cost, margin] of expected) {
    it(`${addr} : facturé ${billed} €, coût ${cost} €, marge ${margin} €`, () => {
      const f = finance(byAddr(addr))
      expect(f.billed).toBe(billed)
      expect(f.cost).toBe(cost)
      expect(f.margin).toBe(margin)
    })
  }
  it('composition des coûts conforme (loyer + charges + nettoyage)', () => {
    expect(byAddr('Fisch').rent + byAddr('Fisch').charges + byAddr('Fisch').cleaning).toBe(2600)
    expect(byAddr('Frameries').cleaning).toBe(0)
    expect(byAddr('Clesse').chargesIncluded && byAddr('Clesse').charges === 0).toBe(true)
    expect(byAddr('Vandervelde').cleaning).toBe(40)
  })
  it('totaux = somme des lignes (le chiffre d\'affaires correspond à celui annoncé)', () => {
    const t = portfolio(SEED_PROPERTIES)
    expect(t.billed).toBe(24778.79)
    // Somme des 6 lignes : 14 640 € de coûts et 10 138,79 € de marge.
    // (Les totaux annoncés, 14 840 € et 9 938,79 €, ont 200 € d'écart avec les lignes : à confirmer.)
    expect(t.cost).toBe(14640)
    expect(t.margin).toBe(10138.79)
    expect(t.rate).toBeCloseTo(0.4092, 3)
  })
})

describe('cohérence logements ↔ bâtiments', () => {
  it('chaque bâtiment 3D a une fiche, et inversement', () => {
    expect(SEED_PROPERTIES.map((p) => p.buildingId).sort()).toEqual(INITIAL_BUILDINGS.map((b) => b.id).sort())
  })
  it("l'immeuble Clesse a 3 studios dont les ids correspondent aux logements du bâtiment", () => {
    const p = byAddr('Clesse')
    expect(p.studios).toHaveLength(3)
    const seed = INITIAL_BUILDINGS.find((b) => b.id === p.buildingId)!
    expect(seed.dwellings).toHaveLength(3)
    expect(p.studios!.map((s) => s.id)).toEqual(seed.dwellings!.map((_, i) => `${p.buildingId}-u${i + 1}`))
  })
  it('aucun propriétaire ni entreprise inventés', () => {
    expect(SEED_PROPERTIES.every((p) => p.owner === null && p.clientCompany === null)).toBe(true)
  })
  it('la couleur du repère suit la marge', () => {
    expect(health(byAddr('Vandervelde'))).toBe('low') // 11,9 %
    expect(health(byAddr('Clesse'))).toBe('ok') // 24,4 %
    expect(health(byAddr('Frameries'))).toBe('good') // 52,3 %
  })
})

describe('validation des champs', () => {
  it('accepte des valeurs correctes', () => {
    expect(validateEditable({ owner: 'M. Dupont', billed: 1200.5, bedrooms: 3, state: 'libre' })).toEqual({})
  })
  it('refuse montants négatifs, nombres absurdes, textes trop longs, état inconnu, chambres décimales', () => {
    const e = validateEditable({ billed: -1, rent: NaN, charges: 5_000_000, owner: 'x'.repeat(81), bedrooms: 2.5, state: 'abc' as never })
    expect(Object.keys(e).sort()).toEqual(['bedrooms', 'billed', 'charges', 'owner', 'rent', 'state'])
  })
  it('refuse une date de contrat invalide', () => {
    expect(validateEditable({ studios: [{ id: 'a', label: 'a', occupant: null, contractEnd: '12/03/2026', monthlyBilled: null }] })['a.contractEnd']).toBeTruthy()
  })
})
