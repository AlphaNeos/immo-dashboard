import { Builder, type Vol } from './builder'

// Petit immeuble de rapport : 3 étages (un appartement par niveau), façade en pierre claire,
// entrée à portail, balcon fer forgé, toit mansardé en zinc avec lucarnes.
export function apartmentBlock(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.45, hx: 1.15, hz: 0.7 }
  b.lawn('#86c964')
  b.path(0, 0.25, 1.45, 0.42, '#d9cfba')
  b.hedges('#4f9d44', 0, 0.55, 0.14)
  b.box(0, 0, -0.45, 2.36, 0.1, 1.46, '#a8a090')
  b.box(0, 0.1, -0.45, 2.3, 0.55, 1.4, '#dccfb3')
  b.box(0, 0.65, -0.45, 2.3, 0.5, 1.4, '#eadfc6')
  b.box(0, 1.15, -0.45, 2.3, 0.5, 1.4, '#eadfc6')
  for (const y of [0.64, 1.14]) b.box(0, y, -0.45, 2.38, 0.035, 1.48, '#f7f1e3')
  b.box(0, 1.65, -0.45, 2.42, 0.06, 1.52, '#f7f1e3')
  b.hip(0, 1.71, -0.45, 2.3, 1.46, 0.42, '#6d7885')
  b.chimney(0.7, 1.95, -0.75, 0.25, '#a4503a')
  b.chimney(-0.7, 1.95, -0.75, 0.25, '#a4503a')
  // lucarnes
  for (const x of [-0.7, 0, 0.7]) {
    b.box(x, 1.75, 0.0, 0.26, 0.17, 0.22, '#eadfc6')
    b.gable(x, 1.92, 0.0, 0.26, 0.34, 0.1, '#6d7885', 'z')
    b.wallBox({ cx: x, cz: 0, hx: 0, hz: 0.11 }, 'front', 0, 1.78, 0.14, 0.11, 0.03, -0.005, '#9fd3ea', 'glass')
  }
  // entrée
  for (let i = 0; i < 2; i++) b.wallBox(v, 'front', 0, 0, 0.7, (i + 1) * 0.05, (2 - i) * 0.1, 0, '#cfc8b8')
  b.door(v, 'front', -0.075, 0.1, 0.13, 0.42, '#2f5d50')
  b.door(v, 'front', 0.075, 0.1, 0.13, 0.42, '#2f5d50')
  b.wallBox(v, 'front', 0, 0.55, 0.36, 0.06, 0.02, -0.005, '#9fd3ea', 'glass')
  for (const s of [-1, 1]) b.wallBox(v, 'front', s * 0.26, 0.1, 0.07, 0.52, 0.05, 0, '#f7f1e3')
  b.wallBox(v, 'front', 0, 0.6, 0.6, 0.04, 0.07, 0, '#f7f1e3')
  // boîtes aux lettres
  for (let i = 0; i < 3; i++) b.wallBox(v, 'front', -0.75 + i * 0.1, 0.25, 0.07, 0.05, 0.03, 0, ['#e6b422', '#4a90d9', '#d9534f'][i])
  // fenêtres : rez, 1er et 2e étage
  for (const x of [-1, -0.62, 0.62, 1]) b.window(v, 'front', x, 0.2, 0.2, 0.3, { shutter: '#7d8c93' })
  for (const [y, col] of [[0.72, '#ff6b8b'], [1.22, '#ffd166']] as [number, string][]) {
    for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) {
      b.window(v, 'front', x, y, 0.2, 0.34, { sill: false })
      b.wallBox(v, 'front', x, y - 0.1, 0.24, 0.07, 0.07, 0.0, '#8a6a4a')
      b.flowers(v.cx + x, v.cz + v.hz + 0.05, 3, 0.16, [col, '#ffffff', col])
    }
  }
  // balcon fer forgé (appartement du 1er)
  b.wallBox(v, 'front', 0, 0.66, 1.4, 0.03, 0.16, 0, '#d9d2c0')
  b.railing(v, 'front', 0, 0.69, 1.4, '#2b2f36', 0.12, 0.14)
  // côtés et arrière
  for (const side of ['left', 'right'] as const) for (const y of [0.2, 0.72, 1.22]) for (const a of [-0.2, 0.25]) b.window(v, side, a, y, 0.2, y === 0.2 ? 0.28 : 0.34)
  for (const y of [0.2, 0.72, 1.22]) for (const a of [-0.7, 0, 0.7]) b.window(v, 'back', a, y, 0.2, y === 0.2 ? 0.28 : 0.34)
  // jardin
  b.cyl(0.95, 0, 0.7, 0.07, 0.17, '#6b7280', 8)
  b.cyl(1.1, 0, 0.7, 0.07, 0.17, '#4a7c59', 8)
  b.tree(-1.2, 0.85, 1.15)
  b.tree(1.2, -1.15, 1.0, '#88c24d')
  b.bush(-0.75, 0.35, 0.13); b.bush(0.75, 0.35, 0.13)
  b.flowers(-0.95, 0.9, 6, 0.8)
}
