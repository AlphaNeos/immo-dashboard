import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decode, hasRealistic, type RealModelData } from './realistic'

const load = (id: string) => JSON.parse(readFileSync(join(__dirname, 'realistic', `${id}.json`), 'utf8')) as RealModelData

describe('modèles réalistes (Higgsfield)', () => {
  for (const id of ['bld-001', 'bld-005']) {
    it(`${id} : se décode, tient dans la parcelle (3,2) et reste léger`, () => {
      expect(hasRealistic(id)).toBe(true)
      const d = load(id)
      const { geometry, height } = decode(d)
      const bb = geometry.boundingBox!
      expect(bb.min.y).toBeGreaterThanOrEqual(-0.001) // posé au sol
      expect(Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z)).toBeLessThanOrEqual(3.2)
      expect(height).toBeGreaterThan(0.5)
      expect(d.triangles).toBeLessThanOrEqual(15000)
      expect(Array.from(geometry.attributes.normal.array).every(Number.isFinite)).toBe(true)
      expect(d.texture?.startsWith('data:image/webp;base64,')).toBe(true)
      expect(JSON.stringify(d).length).toBeLessThan(700_000)
    })
  }
  it('les autres logements gardent leur maquette', () => {
    for (const id of ['bld-002', 'bld-003', 'bld-004', 'bld-006']) expect(hasRealistic(id)).toBe(false)
  })
})
