import { describe, expect, it } from 'vitest'
import { SEED_PROPERTIES, type Property } from '../housing/properties'
import { achievements, levelFor, monthAccrual, quests, ranking, requiredFor } from './progress'

const by = (a: string) => SEED_PROPERTIES.find((p) => p.address.includes(a))!

describe('niveaux', () => {
  it('10 138,79 € de marge = niveau Promoteur, 4 861,21 € avant Magnat', () => {
    const l = levelFor(10138.79)
    expect(l.name).toBe('Promoteur')
    expect(l.next?.name).toBe('Magnat')
    expect(l.missing).toBe(4861.21)
    expect(l.progress).toBeCloseTo(0.0278, 3)
  })
  it('bornes', () => {
    expect(levelFor(0).name).toBe('Débutant')
    expect(levelFor(2499.99).name).toBe('Débutant')
    expect(levelFor(2500).name).toBe('Gestionnaire')
    expect(levelFor(1e9).next).toBeNull()
  })
})

describe('compteur du mois (prorata, sans toucher à l\'horloge)', () => {
  it('début, milieu et fin de mois', () => {
    expect(monthAccrual(3100, new Date(2026, 9, 1, 0, 0, 0)).amount).toBe(0)
    const mid = monthAccrual(3100, new Date(2026, 9, 16, 12, 0, 0)) // octobre : 31 jours
    expect(mid.daysInMonth).toBe(31)
    expect(mid.amount).toBeCloseTo(3100 * (15.5 / 31), 6)
    expect(mid.monthName).toBe('octobre')
    expect(monthAccrual(2800, new Date(2027, 1, 28, 23, 59, 59)).daysInMonth).toBe(28)
  })
})

describe('objectif de marge', () => {
  it('Vandervelde : 15 % = facturer 1 400 € (+50 €) ou −42,50 € de coûts', () => {
    const r = requiredFor(by('Vandervelde'), 0.15)
    expect(r.reached).toBe(false)
    expect(r.billedNeeded).toBe(1400)
    expect(r.billedDelta).toBe(50)
    expect(r.costDelta).toBe(42.5)
  })
  it('Frameries (52 %) a déjà dépassé 30 %', () => {
    expect(requiredFor(by('Frameries'), 0.3).reached).toBe(true)
  })
})

describe('trophées', () => {
  const a = Object.fromEntries(achievements(SEED_PROPERTIES).map((x) => [x.id, x]))
  it('débloqués par les vrais chiffres', () => {
    for (const id of ['first', 'six', 'block', 'elite', '10k', '100k']) expect(a[id].unlocked).toBe(true)
  })
  it('verrouillés tant que les données manquent ou que la marge est trop faible', () => {
    expect(a.noweak.unlocked).toBe(false)
    expect(a.noweak.progress).toEqual([5, 6])
    expect(a.owners.progress).toEqual([0, 6])
    expect(a.rooms.progress).toEqual([3, 5])
    expect(a.studios.progress).toEqual([0, 3])
    expect(a.magnat.unlocked).toBe(false)
  })
  it('se débloquent quand on complète les fiches', () => {
    const filled: Property[] = SEED_PROPERTIES.map((p) => ({ ...p, owner: 'X' }))
    expect(achievements(filled).find((x) => x.id === 'owners')!.unlocked).toBe(true)
  })
})

describe('objectifs', () => {
  const q = quests(SEED_PROPERTIES)
  it('objectifs de données, défis financiers et prochain niveau', () => {
    expect(q.find((x) => x.id === 'q-owners')!.targets).toHaveLength(6)
    expect(q.find((x) => x.id === 'q-rooms')!.targets).toEqual(['bld-005', 'bld-006'])
    expect(q.find((x) => x.id === 'q-15-bld-004')!.detail.replace(/\s/g, ' ')).toContain('1 400,00')
    expect(q.find((x) => x.id === 'q-30-bld-003')).toBeTruthy() // Clesse à 24 %
    expect(q.find((x) => x.kind === 'level')!.title).toBe('Devenir Magnat')
  })
  it("un objectif rempli passe à « fait »", () => {
    const filled = SEED_PROPERTIES.map((p) => ({ ...p, clientCompany: 'Client' }))
    expect(quests(filled).find((x) => x.id === 'q-clients')!.done).toBe(true)
  })
})

describe('classement', () => {
  it('par marge : Hôpital (2 650 €) en tête, Vandervelde (160 €) dernier', () => {
    const r = ranking(SEED_PROPERTIES)
    expect(r[0].p.address).toContain('Hôpital')
    expect(r[r.length - 1].p.address).toContain('Vandervelde')
  })
  it('par taux : Hôpital (53 %) devant Frameries (52,3 %)', () => {
    const r = ranking(SEED_PROPERTIES, 'rate')
    expect(r[0].p.address).toContain('Hôpital')
    expect(r[1].p.address).toContain('Frameries')
  })
})
