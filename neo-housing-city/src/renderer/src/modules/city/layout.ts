// Données pures de la ville (aucun code 3D ici) : positions des routes, blocs,
// parcelles constructibles et décors. Tout est déterministe (même ville à chaque lancement).

export type V3 = [number, number, number]

export interface Item {
  p: V3
  s?: number | V3
  ry?: number
  c?: string
}

export const HALF = 28 // le terrain mesure 56 x 56
export const ROAD_W = 2.4
export const BLOCK = 8 // côté d'un bloc urbain
export const ROADS_X = [-15.6, -5.2, 5.2, 15.6] // routes orientées nord-sud, à ces positions x
export const ROADS_Z = [-10.4, 0, 10.4] // routes orientées est-ouest, à ces positions z
export const SIDEWALK_TOP = 0.12
export const POND = { x: 22.4, z: 19.8, r: 3.4 }

export type PlotKind = 'buildable' | 'park' | 'fountain'
export interface Plot {
  x: number
  z: number
  size: number
  top: number // hauteur de la surface de la parcelle
  kind: PlotKind
}

interface Rect { x0: number; x1: number; z0: number; z1: number }

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function intervals(roads: number[]): [number, number][] {
  const edges = [-HALF, ...roads.flatMap((r) => [r - ROAD_W / 2, r + ROAD_W / 2]), HALF]
  const out: [number, number][] = []
  for (let i = 0; i < edges.length; i += 2) out.push([edges[i], edges[i + 1]])
  return out
}

function buildBlocks() {
  const urban: Rect[] = []
  const outer: Rect[] = []
  for (const [x0, x1] of intervals(ROADS_X)) {
    for (const [z0, z1] of intervals(ROADS_Z)) {
      const r = { x0, x1, z0, z1 }
      if (Math.abs(x1 - x0 - BLOCK) < 1e-6 && Math.abs(z1 - z0 - BLOCK) < 1e-6) urban.push(r)
      else outer.push(r)
    }
  }
  return { urban, outer }
}

const pick = <T,>(rnd: () => number, a: T[]) => a[Math.floor(rnd() * a.length)]

export type TreeKind = 'round' | 'pine'
export interface Tree { x: number; z: number; base: number; s: number; kind: TreeKind; c: string }

export function buildCity() {
  const rnd = mulberry32(20260101)
  const { urban, outer } = buildBlocks()

  // ---- Parcelles
  const plots: Plot[] = []
  urban.forEach((b, bi) => {
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    ;[[-1.75, -1.75], [1.75, -1.75], [-1.75, 1.75], [1.75, 1.75]].forEach(([dx, dz], qi) => {
      const idx = bi * 4 + qi
      const kind: PlotKind = idx === 5 ? 'fountain' : idx % 3 === 2 ? 'park' : 'buildable'
      plots.push({ x: cx + dx, z: cz + dz, size: 3.2, top: SIDEWALK_TOP + 0.03, kind })
    })
  })
  // grandes zones constructibles en périphérie (extensions futures)
  const outerPlots: Rect[] = [
    { x0: -25.4, x1: -19.4, z0: -22.8, z1: -16.8 },
    { x0: 19.4, x1: 25.4, z0: -22.8, z1: -16.8 },
    { x0: -25.4, x1: -19.4, z0: 16.8, z1: 22.8 }
  ]
  for (const r of outerPlots) {
    plots.push({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, size: 6, top: 0.04, kind: 'buildable' })
  }

  // ---- Exclusions pour les arbres et décors extérieurs
  const blocked = (x: number, z: number, m = 0) => {
    if (ROADS_X.some((r) => Math.abs(x - r) < ROAD_W / 2 + 0.9 + m)) return true
    if (ROADS_Z.some((r) => Math.abs(z - r) < ROAD_W / 2 + 0.9 + m)) return true
    if (Math.abs(x) < 17.4 + m && Math.abs(z) < 12.2 + m) return true
    if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.4 + m) return true
    if (outerPlots.some((r) => x > r.x0 - 1.2 - m && x < r.x1 + 1.2 + m && z > r.z0 - 1.2 - m && z < r.z1 + 1.2 + m)) return true
    return false
  }

  // ---- Arbres extérieurs (tirage avec distance minimale)
  const trees: Tree[] = []
  const roundCols = ['#5fae4a', '#6dbb52', '#4f9d44', '#88c24d', '#78b84a']
  const pineCols = ['#2f7d4f', '#3b8c57', '#2a6f48']
  for (let tries = 0; tries < 4000 && trees.length < 120; tries++) {
    const x = (rnd() * 2 - 1) * (HALF - 1)
    const z = (rnd() * 2 - 1) * (HALF - 1)
    if (blocked(x, z)) continue
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 1.5)) continue
    const pine = rnd() < 0.4
    const rare = rnd()
    const c = pine ? pick(rnd, pineCols) : rare < 0.08 ? '#f2a1c0' : rare < 0.14 ? '#e3a93c' : pick(rnd, roundCols)
    trees.push({ x, z, base: 0, s: 0.9 + rnd() * 0.7, kind: pine ? 'pine' : 'round', c })
  }

  // ---- Contenu des parcs
  const bushes: Item[] = []
  const flowers: Item[] = []
  const benches: Item[] = []
  const flowerCols = ['#ff6b8b', '#ffd166', '#ffffff', '#b388ff', '#ff9e5e']
  for (const pl of plots.filter((p) => p.kind === 'park')) {
    trees.push({
      x: pl.x + (rnd() - 0.5) * 1.4, z: pl.z + (rnd() - 0.5) * 1.4, base: pl.top,
      s: 0.85 + rnd() * 0.25, kind: 'round', c: rnd() < 0.3 ? '#f2a1c0' : pick(rnd, roundCols)
    })
    for (let i = 0; i < 4; i++) {
      bushes.push({ p: [pl.x + (rnd() - 0.5) * 2.6, pl.top + 0.1, pl.z + (rnd() - 0.5) * 2.6], s: 0.5 + rnd() * 0.3, c: pick(rnd, ['#4f9d44', '#5fae4a']) })
    }
    for (let i = 0; i < 16; i++) {
      flowers.push({ p: [pl.x + (rnd() - 0.5) * 2.8, pl.top + 0.05, pl.z + (rnd() - 0.5) * 2.8], s: 0.7 + rnd() * 0.5, c: pick(rnd, flowerCols) })
    }
    if (rnd() < 0.6) benches.push({ p: [pl.x, pl.top, pl.z + 1.25], ry: 0 })
  }

  // ---- Décors extérieurs : buissons, fleurs, rochers
  const rocks: Item[] = []
  for (let i = 0; i < 40; i++) {
    const x = (rnd() * 2 - 1) * (HALF - 1)
    const z = (rnd() * 2 - 1) * (HALF - 1)
    if (blocked(x, z, -0.4)) continue
    bushes.push({ p: [x, 0.1, z], s: 0.5 + rnd() * 0.5, c: pick(rnd, ['#4f9d44', '#5fae4a', '#6dbb52']) })
  }
  for (let patch = 0; patch < 22; patch++) {
    const px = (rnd() * 2 - 1) * (HALF - 2)
    const pz = (rnd() * 2 - 1) * (HALF - 2)
    if (blocked(px, pz)) continue
    for (let i = 0; i < 7; i++) {
      flowers.push({ p: [px + (rnd() - 0.5) * 1.6, 0.05, pz + (rnd() - 0.5) * 1.6], s: 0.7 + rnd() * 0.5, c: pick(rnd, flowerCols) })
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2
    const d = POND.r + 0.5 + rnd() * 0.6
    rocks.push({ p: [POND.x + Math.cos(a) * d, 0.08, POND.z + Math.sin(a) * d], s: 0.3 + rnd() * 0.35, ry: rnd() * 6, c: pick(rnd, ['#9aa0a6', '#b0b5ba', '#8b9096']) })
  }
  for (let i = 0; i < 14; i++) {
    const x = (rnd() * 2 - 1) * (HALF - 1)
    const z = (rnd() * 2 - 1) * (HALF - 1)
    if (blocked(x, z)) continue
    rocks.push({ p: [x, 0.08, z], s: 0.25 + rnd() * 0.3, ry: rnd() * 6, c: pick(rnd, ['#9aa0a6', '#b0b5ba']) })
  }

  // ---- Lampadaires : 8 par bloc urbain (coins + milieux), sur le trottoir
  const lamps: Item[] = []
  for (const b of urban) {
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    const o = BLOCK / 2 - 0.25
    for (const [dx, dz] of [[-o, -o], [o, -o], [-o, o], [o, o], [0, -o], [0, o], [-o, 0], [o, 0]]) {
      lamps.push({ p: [cx + dx, SIDEWALK_TOP, cz + dz] })
    }
  }

  // ---- Terrain : taches d'herbe
  const patches: Item[] = []
  const grassCols = ['#86cf63', '#72bb52', '#8fd16b', '#6bb04d']
  for (let i = 0; i < 46; i++) {
    patches.push({ p: [(rnd() * 2 - 1) * (HALF - 3), 0.004 + i * 0.0004, (rnd() * 2 - 1) * (HALF - 3)], s: [1 + rnd() * 2.2, 1, 1 + rnd() * 2.2], c: pick(rnd, grassCols) })
  }

  // ---- Marquages au sol
  const dashes: Item[] = []
  const stops = (roads: number[]) => {
    const pts = [-HALF, ...roads.flatMap((r) => [r - (ROAD_W / 2 + 1.1), r + (ROAD_W / 2 + 1.1)]), HALF]
    const segs: [number, number][] = []
    for (let i = 0; i < pts.length; i += 2) segs.push([pts[i], pts[i + 1]])
    return segs
  }
  const lineY = 0.056
  for (const rx of ROADS_X) {
    for (const [a, b] of stops(ROADS_Z)) {
      const n = Math.floor((b - a) / 1.6)
      const start = (a + b) / 2 - ((n - 1) * 1.6) / 2
      for (let i = 0; i < n; i++) dashes.push({ p: [rx, lineY, start + i * 1.6], s: [0.12, 0.012, 0.8], c: '#f4d35e' })
    }
  }
  for (const rz of ROADS_Z) {
    for (const [a, b] of stops(ROADS_X)) {
      const n = Math.floor((b - a) / 1.6)
      const start = (a + b) / 2 - ((n - 1) * 1.6) / 2
      for (let i = 0; i < n; i++) dashes.push({ p: [start + i * 1.6, lineY, rz], s: [0.8, 0.012, 0.12], c: '#f4d35e' })
    }
  }
  const crosswalks: Item[] = []
  for (const rx of ROADS_X) {
    for (const rz of ROADS_Z) {
      const d = ROAD_W / 2 + 0.45
      for (let k = -2; k <= 2; k++) {
        for (const sgn of [-1, 1]) {
          crosswalks.push({ p: [rx + sgn * d, lineY, rz + k * 0.42], s: [0.6, 0.012, 0.22], c: '#f5f5f0' })
          crosswalks.push({ p: [rx + k * 0.42, lineY, rz + sgn * d], s: [0.22, 0.012, 0.6], c: '#f5f5f0' })
        }
      }
    }
  }

  // ---- Surfaces des parcelles + contours des zones constructibles
  const pads: Item[] = plots.map((p) => ({
    p: [p.x, p.top - 0.015, p.z], s: [p.size, 0.03, p.size],
    c: p.kind === 'buildable' ? '#eadfbf' : p.kind === 'park' ? '#8fcf6a' : '#d8d2c4'
  }))
  const borders: Item[] = []
  for (const p of plots.filter((q) => q.kind === 'buildable')) {
    const y = p.top + 0.006
    const e = p.size / 2 - 0.05
    const c = '#f0a93b'
    borders.push({ p: [p.x, y, p.z - e], s: [p.size - 0.04, 0.012, 0.09], c })
    borders.push({ p: [p.x, y, p.z + e], s: [p.size - 0.04, 0.012, 0.09], c })
    borders.push({ p: [p.x - e, y, p.z], s: [0.09, 0.012, p.size - 0.2], c })
    borders.push({ p: [p.x + e, y, p.z], s: [0.09, 0.012, p.size - 0.2], c })
  }

  // ---- Trottoirs des blocs extérieurs (bande de 0,5 le long des routes)
  const strips: Item[] = []
  for (const b of outer) {
    const w = b.x1 - b.x0
    const d = b.z1 - b.z0
    const cx = (b.x0 + b.x1) / 2
    const cz = (b.z0 + b.z1) / 2
    const y = SIDEWALK_TOP / 2
    if (b.x0 > -HALF) strips.push({ p: [b.x0 + 0.25, y, cz], s: [0.5, SIDEWALK_TOP, d] })
    if (b.x1 < HALF) strips.push({ p: [b.x1 - 0.25, y, cz], s: [0.5, SIDEWALK_TOP, d] })
    if (b.z0 > -HALF) strips.push({ p: [cx, y, b.z0 + 0.25], s: [w, SIDEWALK_TOP, 0.5] })
    if (b.z1 < HALF) strips.push({ p: [cx, y, b.z1 - 0.25], s: [w, SIDEWALK_TOP, 0.5] })
  }

  return {
    urban, plots, trees, bushes, flowers, benches, rocks, lamps, patches, dashes, crosswalks, pads, borders, strips
  }
}

export type CityData = ReturnType<typeof buildCity>
