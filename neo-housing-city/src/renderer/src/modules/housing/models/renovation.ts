import { Builder, type Vol } from './builder'

// Maison en rénovation : murs à moitié enduits, toit partiellement ouvert (chevrons), échafaudage,
// benne, barrières de chantier, tas de gravats.
export function renovation(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.5, hx: 0.85, hz: 0.65 }
  b.lawn('#b9a57c')
  b.box(0, -0.004, 0.7, 1.9, 0.012, 1.2, '#a8946b')
  b.box(0, 0, -0.5, 1.74, 0.06, 1.34, '#8f8a82')
  b.box(-0.425, 0.06, -0.5, 0.85, 0.7, 1.3, '#cbbfae') // enduit à faire
  b.box(0.425, 0.06, -0.5, 0.85, 0.7, 1.3, '#f2e3c2') // déjà refait
  // toit : moitié droite en tuiles, moitié gauche en chevrons
  b.gable(0.5, 0.76, -0.5, 0.9, 1.5, 0.5, '#c4553a', 'x')
  b.box(-0.45, 1.25, -0.5, 0.95, 0.04, 0.05, '#b88a54')
  const slope = Math.atan(0.5 / 0.75)
  for (let i = 0; i < 5; i++) {
    const x = -0.85 + i * 0.2
    b.boxRot(x, 0.76 + 0.25, -0.5 + 0.375, 0.035, 0.035, 0.9, slope, 0, 0, '#b88a54')
    b.boxRot(x, 0.76 + 0.25, -0.5 - 0.375, 0.035, 0.035, 0.9, -slope, 0, 0, '#b88a54')
  }
  b.boxRot(-0.5, 0.76 + 0.22, -0.5 + 0.4, 0.55, 0.012, 0.5, slope, 0, 0, '#3b82c4') // bâche
  b.chimney(0.5, 0.95, -0.75, 0.32)
  // ouvertures
  b.door(v, 'front', 0, 0.06, 0.22, 0.4, '#c9a56b', '#e4d9c3')
  b.window(v, 'front', 0.5, 0.3, 0.22, 0.26, { shutter: '#4f8f5b' })
  b.wallBox(v, 'front', -0.5, 0.3, 0.26, 0.3, 0.02, 0, '#c9a56b') // fenêtre condamnée
  b.wallBox(v, 'front', -0.5, 0.3, 0.26, 0.025, 0.03, 0.01, '#8a6a4a')
  b.wallBox(v, 'front', -0.5, 0.42, 0.26, 0.025, 0.03, 0.01, '#8a6a4a')
  b.window(v, 'right', 0, 0.3, 0.22, 0.26)
  b.window(v, 'back', 0, 0.3, 0.22, 0.26)
  // échafaudage (côté gauche de la façade)
  for (const x of [-0.8, -0.2]) for (const z of [0.3, 0.12]) b.cyl(x, 0, z, 0.012, 1.0, '#8c939c', 5)
  for (const y of [0.3, 0.62, 0.94]) {
    b.box(-0.5, y, 0.3, 0.7, 0.014, 0.014, '#8c939c')
    b.box(-0.5, y, 0.12, 0.7, 0.014, 0.014, '#8c939c')
    b.box(-0.5, y + 0.015, 0.21, 0.66, 0.02, 0.2, '#c9a56b')
  }
  b.boxRot(-0.5, 0.5, 0.31, 0.015, 0.7, 0.015, 0, 0, 0.75, '#8c939c')
  // chantier
  b.box(0.95, 0, 0.85, 0.6, 0.2, 0.34, '#e08a1e')
  b.box(0.95, 0.2, 0.85, 0.52, 0.02, 0.26, '#3a2f22')
  for (let i = 0; i < 5; i++) b.ball(0.95 + (i - 2) * 0.08, 0.24, 0.85 + (i % 2) * 0.05, 0.05, ['#9aa0a6', '#b0b5ba', '#a4503a'][i % 3])
  b.box(-0.9, 0, 1.0, 0.5, 0.06, 0.2, '#c9a56b'); b.box(-0.9, 0.06, 1.0, 0.5, 0.06, 0.2, '#b88a54')
  for (let i = 0; i < 3; i++) b.box(-0.25 + i * 0.12, 0, 1.0, 0.1, 0.06 * (3 - i), 0.1, '#a4503a')
  for (const [x, z] of [[0.3, 1.2], [-1.2, 0.5]]) b.cyl(x, 0, z, 0.06, 0.13, '#ff7a1a', 8, 0.015)
  // barrière de chantier
  for (let i = 0; i < 4; i++) {
    const x = -1.3 + i * 0.5
    b.box(x, 0.0, 1.38, 0.4, 0.1, 0.02, '#ffffff'); b.box(x, 0.1, 1.38, 0.4, 0.07, 0.02, '#ff7a1a'); b.box(x - 0.18, 0, 1.38, 0.02, 0.2, 0.02, '#555b63')
  }
  b.tree(1.2, -1.1, 0.9, '#78b84a')
}
