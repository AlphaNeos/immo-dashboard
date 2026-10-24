import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Assemble un bâtiment à partir de formes simples, puis fusionne le tout en 2 maillages
// (« body » opaque et « glass » pour les vitres) : 2 appels graphiques par bâtiment.
// Repère local : origine au centre de la parcelle, façade tournée vers +z, y = 0 au sol de la parcelle.

export type Side = 'front' | 'back' | 'left' | 'right'
export type Layer = 'body' | 'glass'
export interface Vol { cx: number; cz: number; hx: number; hz: number }
type P3 = [number, number, number]

export const LAWN = 0.04
const ROT: Record<Side, number> = { front: 0, right: Math.PI / 2, back: Math.PI, left: -Math.PI / 2 }

export class Builder {
  private parts: Record<Layer, BufferGeometry[]> = { body: [], glass: [] }
  private seed = 12345

  // Pseudo-aléatoire déterministe : les mêmes fenêtres sont allumées à chaque lancement.
  private rand() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0
    return this.seed / 4294967296
  }

  private tint(g: BufferGeometry, color: string): BufferGeometry {
    const out = g.index ? g.toNonIndexed() : g
    out.deleteAttribute('uv')
    const c = new Color(color)
    const n = out.attributes.position.count
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b }
    out.setAttribute('color', new Float32BufferAttribute(arr, 3))
    return out
  }
  add(g: BufferGeometry, color: string, layer: Layer = 'body') {
    const t = this.tint(g, color)
    if (layer === 'glass') {
      const lit = this.rand() < 0.6 ? 1 : 0 // ~60 % des fenêtres s'allument la nuit
      const n = t.attributes.position.count
      t.setAttribute('aLit', new Float32BufferAttribute(new Float32Array(n).fill(lit), 1))
    }
    this.parts[layer].push(t)
  }

  // ---- formes de base (y0 = hauteur du bas, au-dessus du gazon)
  box(cx: number, y0: number, cz: number, w: number, h: number, d: number, color: string, layer: Layer = 'body') {
    const g = new BoxGeometry(w, h, d)
    g.translate(cx, LAWN + y0 + h / 2, cz)
    this.add(g, color, layer)
  }
  boxRot(cx: number, cy: number, cz: number, w: number, h: number, d: number, rx: number, ry: number, rz: number, color: string) {
    const g = new BoxGeometry(w, h, d)
    g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz)
    g.translate(cx, LAWN + cy, cz)
    this.add(g, color)
  }
  cyl(cx: number, y0: number, cz: number, r: number, h: number, color: string, seg = 10, rTop = r) {
    const g = new CylinderGeometry(rTop, r, h, seg)
    g.translate(cx, LAWN + y0 + h / 2, cz)
    this.add(g, color)
  }
  cone(cx: number, y0: number, cz: number, r: number, h: number, color: string, seg = 8) {
    const g = new ConeGeometry(r, h, seg)
    g.translate(cx, LAWN + y0 + h / 2, cz)
    this.add(g, color)
  }
  // Petite voiture garée (façade du véhicule vers +z ou +x selon rotY).
  car(cx: number, cz: number, rotY: number, color: string) {
    const parts: [number, number, number, number, number, number, string][] = [
      [0, 0.07, 0, 0.38, 0.1, 0.8, color], [0, 0.17, -0.04, 0.32, 0.1, 0.42, color], [0, 0.185, -0.04, 0.326, 0.055, 0.38, '#27384a']
    ]
    for (const [x, y, z, w, h, d, c] of parts) {
      const g = new BoxGeometry(w, h, d)
      g.translate(x, LAWN + y + h / 2, z); g.rotateY(rotY); g.translate(cx, 0, cz)
      this.add(g, c)
    }
    for (const [x, z] of [[-0.18, 0.26], [0.18, 0.26], [-0.18, -0.26], [0.18, -0.26]]) {
      const g = new CylinderGeometry(0.065, 0.065, 0.045, 10)
      g.rotateZ(Math.PI / 2); g.translate(x, LAWN + 0.065, z); g.rotateY(rotY); g.translate(cx, 0, cz)
      this.add(g, '#1b1b1b')
    }
  }
  parasol(cx: number, cz: number, color: string, y0 = 0) {
    this.cyl(cx, y0, cz, 0.012, 0.42, '#e8e8e8', 5)
    this.cone(cx, y0 + 0.38, cz, 0.24, 0.12, color, 8)
  }
  ball(cx: number, cy: number, cz: number, r: number, color: string, sy = 1) {
    const g = new IcosahedronGeometry(r, 1)
    g.scale(1, sy, 1)
    g.translate(cx, LAWN + cy, cz)
    this.add(g, color)
  }

  private poly(faces: P3[][], inside: P3, tx: number, ty: number, tz: number, color: string, rotY = 0) {
    const pos: number[] = []
    for (const f of faces) {
      const fc = f.reduce((a, p) => [a[0] + p[0] / f.length, a[1] + p[1] / f.length, a[2] + p[2] / f.length], [0, 0, 0])
      for (let i = 1; i < f.length - 1; i++) {
        let a = f[0], b = f[i], c = f[i + 1]
        const n = [
          (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
          (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
        ]
        if (n[0] * (fc[0] - inside[0]) + n[1] * (fc[1] - inside[1]) + n[2] * (fc[2] - inside[2]) < 0) [b, c] = [c, b]
        pos.push(...a, ...b, ...c)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.computeVertexNormals()
    if (rotY) g.rotateY(rotY)
    g.translate(tx, LAWN + ty, tz)
    this.add(g, color)
  }

  // Toit à deux pans. ridge = sens du faîtage ; len = longueur du faîtage ; span = largeur à couvrir.
  gable(cx: number, y0: number, cz: number, len: number, span: number, h: number, color: string, ridge: 'x' | 'z' = 'x') {
    const a = span / 2, L = len / 2
    const A: P3 = [-a, 0, -L], B: P3 = [a, 0, -L], C: P3 = [a, 0, L], D: P3 = [-a, 0, L]
    const R1: P3 = [0, h, -L], R2: P3 = [0, h, L]
    this.poly([[A, D, R2, R1], [B, C, R2, R1], [D, C, R2], [A, B, R1], [A, B, C, D]], [0, h / 3, 0], cx, y0, cz, color, ridge === 'x' ? Math.PI / 2 : 0)
  }
  // Toit à quatre pans.
  hip(cx: number, y0: number, cz: number, w: number, d: number, h: number, color: string) {
    const g = new ConeGeometry(0.7071, h, 4)
    g.rotateY(Math.PI / 4)
    g.scale(w, 1, d)
    g.translate(cx, LAWN + y0 + h / 2, cz)
    this.add(g, color)
  }
  // Toit à une pente (hauteur hb à l'arrière, hf à l'avant).
  shed(cx: number, y0: number, cz: number, w: number, d: number, hb: number, hf: number, color: string) {
    const a = w / 2, L = d / 2
    const p: P3[] = [[-a, 0, -L], [a, 0, -L], [a, 0, L], [-a, 0, L], [-a, hb, -L], [a, hb, -L], [a, hf, L], [-a, hf, L]]
    const f = (...i: number[]) => i.map((k) => p[k])
    this.poly([f(0, 1, 2, 3), f(4, 5, 6, 7), f(0, 1, 5, 4), f(3, 2, 6, 7), f(0, 3, 7, 4), f(1, 2, 6, 5)], [0, Math.min(hb, hf) / 2, 0], cx, y0, cz, color)
  }

  // ---- éléments posés sur un mur (along > 0 = vers la droite pour qui regarde le mur)
  wallBox(v: Vol, side: Side, along: number, y0: number, w: number, h: number, depth: number, outset: number, color: string, layer: Layer = 'body') {
    const g = new BoxGeometry(w, h, depth)
    g.translate(along, LAWN + y0 + h / 2, outset + depth / 2)
    g.rotateY(ROT[side])
    const ax = side === 'right' ? v.hx : side === 'left' ? -v.hx : 0
    const az = side === 'front' ? v.hz : side === 'back' ? -v.hz : 0
    g.translate(v.cx + ax, 0, v.cz + az)
    this.add(g, color, layer)
  }
  window(v: Vol, side: Side, along: number, y0: number, w: number, h: number, o: { shutter?: string; sill?: boolean; cross?: boolean; frame?: string } = {}) {
    const frame = o.frame ?? '#fbfaf6'
    this.wallBox(v, side, along, y0 - 0.025, w + 0.05, h + 0.05, 0.03, -0.005, frame)
    this.wallBox(v, side, along, y0, w, h, 0.04, -0.005, '#9fd3ea', 'glass')
    if (o.cross !== false) {
      this.wallBox(v, side, along, y0, 0.018, h, 0.012, 0.035, frame)
      this.wallBox(v, side, along, y0 + h / 2 - 0.01, w, 0.018, 0.012, 0.035, frame)
    }
    if (o.sill !== false) this.wallBox(v, side, along, y0 - 0.045, w + 0.09, 0.022, 0.06, 0, frame)
    if (o.shutter) {
      for (const s of [-1, 1]) this.wallBox(v, side, along + s * (w / 2 + 0.065), y0 - 0.02, 0.06, h + 0.04, 0.02, 0, o.shutter)
    }
  }
  door(v: Vol, side: Side, along: number, y0: number, w: number, h: number, color: string, frame = '#fbfaf6') {
    this.wallBox(v, side, along, y0, w + 0.07, h + 0.04, 0.03, -0.005, frame)
    this.wallBox(v, side, along, y0, w, h, 0.04, -0.005, color)
    this.wallBox(v, side, along + w * 0.32, y0 + h * 0.45, 0.025, 0.025, 0.03, 0.03, '#d9b44a')
  }
  railing(v: Vol, side: Side, along: number, y0: number, w: number, color = '#2b2f36', h = 0.12, outset = 0.02) {
    const n = Math.max(2, Math.round(w / 0.07))
    for (let i = 0; i <= n; i++) this.wallBox(v, side, along - w / 2 + (w * i) / n, y0, 0.01, h, 0.01, outset, color)
    this.wallBox(v, side, along, y0 + h, w + 0.01, 0.015, 0.025, outset - 0.005, color)
    this.wallBox(v, side, along, y0, w + 0.01, 0.012, 0.012, outset, color)
  }

  // ---- jardin
  lawn(color: string, size = 2.95) {
    const g = new BoxGeometry(size, LAWN, size)
    g.translate(0, LAWN / 2, 0)
    this.add(g, color)
  }
  path(x: number, z0: number, z1: number, w: number, color = '#cfc7b8') {
    this.box(x, -0.004, (z0 + z1) / 2, w, 0.012, Math.abs(z1 - z0), color)
  }
  // Haie sur trois côtés (avec une ouverture devant, autour de x = gapX).
  hedges(color = '#4f9d44', gapX = 0, gapW = 0.4, h = 0.15, inset = 1.4) {
    const t = 0.1
    this.box(0, 0, -inset, inset * 2, h, t, color)
    this.box(-inset, 0, 0, t, h, inset * 2, color)
    this.box(inset, 0, 0, t, h, inset * 2, color)
    const l = gapX - gapW / 2 + inset
    const r = inset - (gapX + gapW / 2)
    if (l > 0.05) this.box(-inset + l / 2, 0, inset, l, h, t, color)
    if (r > 0.05) this.box(inset - r / 2, 0, inset, r, h, t, color)
  }
  bush(x: number, z: number, r = 0.12, color = '#5fae4a') { this.ball(x, r * 0.8, z, r, color, 0.85) }
  tree(x: number, z: number, s = 1, color = '#5fae4a') {
    this.cyl(x, 0, z, 0.035 * s, 0.35 * s, '#8b5a2b', 6)
    this.ball(x, 0.55 * s, z, 0.26 * s, color, 0.9)
    this.ball(x + 0.08 * s, 0.75 * s, z - 0.04 * s, 0.17 * s, color)
  }
  flowers(x: number, z: number, n: number, spread: number, cols = ['#ff6b8b', '#ffd166', '#ffffff', '#b388ff']) {
    for (let i = 0; i < n; i++) this.ball(x - spread / 2 + (spread * i) / Math.max(1, n - 1), 0.03, z + (i % 2) * 0.04, 0.026, cols[i % cols.length])
  }
  mailbox(x: number, z: number, color = '#c0392b') {
    this.cyl(x, 0, z, 0.012, 0.16, '#555b63', 5)
    this.box(x, 0.16, z, 0.07, 0.05, 0.05, color)
  }
  chimney(x: number, y0: number, z: number, h = 0.3, color = '#a4503a') {
    this.box(x, y0, z, 0.15, h, 0.15, color)
    this.box(x, y0 + h, z, 0.19, 0.035, 0.19, '#6f6f6f')
  }

  build(): { body: BufferGeometry; glass: BufferGeometry | null } {
    const body = mergeGeometries(this.parts.body, false)
    if (!body) throw new Error('modèle vide')
    const glass = this.parts.glass.length ? mergeGeometries(this.parts.glass, false) : null
    return { body, glass }
  }
}
