import { Builder, type Vol } from './builder'

// Maison classique : murs crème, toit à deux pans en tuiles, volets verts, porche et cheminée.
export function classic(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.5, hx: 0.85, hz: 0.65 }
  b.lawn('#86c964')
  b.path(0, 0.15, 1.45, 0.26)
  b.hedges('#4f9d44', 0)
  b.box(0, 0, -0.5, 1.74, 0.06, 1.34, '#9b958b')
  b.box(0, 0.06, -0.5, 1.7, 0.7, 1.3, '#f2e3c2')
  b.gable(0, 0.76, -0.5, 1.9, 1.5, 0.5, '#c4553a', 'x')
  b.box(0, 1.25, -0.5, 1.9, 0.025, 0.04, '#8c3a28')
  b.chimney(0.5, 0.95, -0.75, 0.32)
  // façade
  b.door(v, 'front', 0, 0.06, 0.22, 0.4, '#7a2e2e')
  b.wallBox(v, 'front', 0, 0.06, 0.5, 0.05, 0.26, 0, '#b9b3a8')
  b.wallBox(v, 'front', 0, 0.5, 0.44, 0.03, 0.24, 0, '#c4553a')
  for (const s of [-1, 1]) b.wallBox(v, 'front', s * 0.2, 0.11, 0.025, 0.39, 0.025, 0.2, '#fbfaf6')
  for (const s of [-1, 1]) b.window(v, 'front', s * 0.5, 0.3, 0.22, 0.26, { shutter: '#4f8f5b' })
  b.window(v, 'right', 0, 0.3, 0.22, 0.26)
  b.window(v, 'right', -0.35, 0.3, 0.22, 0.26)
  b.window(v, 'left', 0, 0.3, 0.22, 0.26)
  b.window(v, 'back', 0.4, 0.3, 0.22, 0.26)
  b.window(v, 'back', -0.4, 0.3, 0.22, 0.26)
  // jardin
  b.mailbox(0.2, 1.3)
  b.flowers(-0.5, 0.2, 5, 0.5)
  b.flowers(0.5, 0.2, 5, 0.5, ['#ffd166', '#ff9e5e', '#ffffff'])
  b.bush(-0.95, 0.15); b.bush(0.95, 0.15, 0.14)
  b.bush(-1.15, 0.9, 0.16, '#6dbb52')
  b.tree(1.1, 0.75, 1.1)
  b.tree(-1.15, -1.05, 0.9, '#78b84a')
}
