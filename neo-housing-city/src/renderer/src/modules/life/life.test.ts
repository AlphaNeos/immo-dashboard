import { describe, expect, it } from 'vitest'
import { buildCity, ROADS_X, ROADS_Z } from '../city/layout'
import { INITIAL_BUILDINGS } from '../housing/buildings'
import { lightingAt, nightAt } from './lighting'
import { PedestrianSim, WALK_INNER, WALK_OUTER } from './pedestrians'
import { TrafficSim, onRoad } from './traffic'

const city = buildCity()

describe('circulation', () => {
  it('toutes les voitures restent sur les routes (jamais sur trottoir, parcelle ou bâtiment) pendant 5 min simulées', () => {
    const sim = new TrafficSim(14)
    const built = city.plots.filter((p) => INITIAL_BUILDINGS.some((b) => b.plotId === p.id))
    const bad: string[] = []
    for (let t = 0; t < 300; t += 1 / 30) {
      sim.update(1 / 30)
      for (const c of sim.cars) {
        if (!onRoad(c.x, c.z, 0.05)) bad.push(`voiture ${c.id} hors route (${c.x.toFixed(2)}, ${c.z.toFixed(2)})`)
        for (const p of city.plots) if (Math.abs(c.x - p.x) < p.size / 2 && Math.abs(c.z - p.z) < p.size / 2) bad.push(`voiture ${c.id} sur la parcelle ${p.id}`)
        for (const p of built) if (Math.hypot(c.x - p.x, c.z - p.z) <= 2) bad.push(`voiture ${c.id} trop près de ${p.id}`)
      }
    }
    expect(bad.slice(0, 5)).toEqual([])
  })
  it('les voitures ne se chevauchent jamais et ne bloquent pas définitivement', () => {
    const sim = new TrafficSim(14)
    let minDist = Infinity
    for (let t = 0; t < 300; t += 1 / 30) {
      sim.update(1 / 30)
      for (let i = 0; i < sim.cars.length; i++)
        for (let j = i + 1; j < sim.cars.length; j++) {
          const a = sim.cars[i], b = sim.cars[j]
          minDist = Math.min(minDist, Math.hypot(a.x - b.x, a.z - b.z))
        }
    }
    expect(minDist).toBeGreaterThan(0.6)
    expect(sim.cars.every((c) => c.odo > 20)).toBe(true) // chaque voiture a bien roulé
  })
  it("aucun blocage (embouteillage définitif) pendant 15 min simulées, plusieurs configurations", () => {
    for (const [n, seed] of [[12, 7], [14, 3], [22, 9]] as [number, number][]) {
      const sim = new TrafficSim(n, seed)
      let maxStop = 0
      for (let t = 0; t < 900; t += 1 / 20) {
        sim.update(1 / 20)
        for (const c of sim.cars) maxStop = Math.max(maxStop, c.stoppedFor)
      }
      expect(maxStop).toBeLessThan(30)
    }
  })
  it('les voitures tournent aux intersections et roulent à droite', () => {
    const sim = new TrafficSim(14)
    for (let t = 0; t < 300; t += 1 / 30) sim.update(1 / 30)
    expect(sim.cars.reduce((n, c) => n + c.turns, 0)).toBeGreaterThan(20)
    // voie de droite : une voiture qui roule vers +x a un z supérieur à l'axe de la route (z croît vers le bas)
    const east = new TrafficSim(14)
    for (let t = 0; t < 60; t += 1 / 30) {
      east.update(1 / 30)
      for (const c of east.cars) {
        if (c.inTurn) continue
        const dx = Math.sin(c.yaw), dz = Math.cos(c.yaw)
        if (Math.abs(dx) > 0.99) {
          const axis = ROADS_Z.reduce((best, r) => (Math.abs(r - c.z) < Math.abs(best - c.z) ? r : best))
          expect((c.z - axis) * dx).toBeGreaterThan(0)
        } else if (Math.abs(dz) > 0.99) {
          const axis = ROADS_X.reduce((best, r) => (Math.abs(r - c.x) < Math.abs(best - c.x) ? r : best))
          expect((c.x - axis) * -dz).toBeGreaterThan(0)
        }
      }
    }
  })
  it('est déterministe', () => {
    const a = new TrafficSim(14, 3), b = new TrafficSim(14, 3)
    for (let i = 0; i < 600; i++) { a.update(1 / 30); b.update(1 / 30) }
    expect(a.cars.map((c) => [c.x, c.z])).toEqual(b.cars.map((c) => [c.x, c.z]))
  })
})

describe('piétons', () => {
  const centers = city.urban.map((b) => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 }))
  it('restent sur le trottoir, à distance des lampadaires', () => {
    const sim = new PedestrianSim(centers, 2)
    expect(sim.walkers.length).toBe(12)
    const bad: string[] = []
    for (let t = 0; t < 400; t += 1 / 10) {
      sim.update(1 / 10)
      for (const w of sim.walkers) {
        const c = centers[w.block]
        const r = Math.max(Math.abs(w.x - c.x), Math.abs(w.z - c.z))
        if (Math.abs(r - WALK_INNER) > 1e-6 && Math.abs(r - WALK_OUTER) > 1e-6) bad.push(`piéton ${w.id} hors du trottoir (r=${r})`)
        if (onRoad(w.x, w.z)) bad.push(`piéton ${w.id} sur la route`)
        for (const l of city.lamps) if (Math.hypot(w.x - l.p[0], w.z - l.p[2]) <= 0.12) bad.push(`piéton ${w.id} dans un lampadaire`)
      }
    }
    expect(bad.slice(0, 5)).toEqual([])
  })
})

describe('jour / nuit', () => {
  it('plein jour à midi, nuit profonde à minuit', () => {
    expect(lightingAt(12).sunIntensity).toBeGreaterThan(2)
    expect(nightAt(12)).toBe(0)
    expect(lightingAt(0).sunIntensity).toBe(0)
    expect(nightAt(0)).toBe(1)
    expect(lightingAt(0).moonIntensity).toBeGreaterThan(0.5)
  })
  it('les lumières sont allumées le soir et éteintes le matin', () => {
    expect(nightAt(21)).toBeGreaterThan(0.9)
    expect(nightAt(10)).toBe(0)
    expect(nightAt(19.5)).toBeGreaterThan(0.1)
    expect(nightAt(19.5)).toBeLessThan(0.95)
  })
  it('transitions continues (pas de saut brutal)', () => {
    let prev = lightingAt(0).sunIntensity
    for (let h = 0.05; h < 24; h += 0.05) {
      const cur = lightingAt(h).sunIntensity
      expect(Math.abs(cur - prev)).toBeLessThan(0.15)
      prev = cur
    }
  })
})
