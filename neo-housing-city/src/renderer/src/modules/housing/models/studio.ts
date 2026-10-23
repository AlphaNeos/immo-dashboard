import { Builder, type Vol } from './builder'

// Studio : petit cube turquoise à toit mono-pente, grande baie, auvent jaune, terrasse bois.
export function studio(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.45, hx: 0.6, hz: 0.5 }
  b.lawn('#8dd06a')
  b.hedges('#5fae4a', 0.3, 0.3, 0.11)
  b.path(0.3, 0.1, 1.45, 0.22)
  b.box(0, 0, -0.45, 1.24, 0.04, 1.04, '#9b958b')
  b.box(0, 0.04, -0.45, 1.2, 0.6, 1.0, '#7fc4b8')
  b.shed(0, 0.64, -0.45, 1.4, 1.2, 0.17, 0.05, '#40464f')
  b.box(-0.3, 0.8, -0.65, 0.22, 0.1, 0.16, '#d9dde0') // climatiseur
  // baie + porte
  b.wallBox(v, 'front', -0.2, 0.1, 0.56, 0.42, 0.03, -0.005, '#ffffff')
  b.wallBox(v, 'front', -0.2, 0.11, 0.52, 0.4, 0.04, -0.005, '#9fd3ea', 'glass')
  b.wallBox(v, 'front', -0.2, 0.11, 0.018, 0.4, 0.012, 0.035, '#ffffff')
  b.door(v, 'front', 0.3, 0.04, 0.16, 0.38, '#f0b83a')
  b.wallBox(v, 'front', 0.3, 0.46, 0.3, 0.025, 0.18, 0, '#f0b83a')
  b.window(v, 'right', 0, 0.2, 0.22, 0.22, { cross: false })
  b.window(v, 'left', 0, 0.2, 0.22, 0.22, { cross: false })
  // terrasse + mobilier
  b.box(-0.2, 0, 0.45, 0.9, 0.03, 0.4, '#b88a54')
  b.cyl(-0.3, 0.03, 0.45, 0.1, 0.012, '#ffffff', 14)
  b.cyl(-0.3, 0.03, 0.45, 0.012, 0.1, '#6b7280', 6)
  b.cyl(-0.3, 0.13, 0.45, 0.1, 0.012, '#ffffff', 14)
  b.box(-0.05, 0.03, 0.45, 0.1, 0.1, 0.1, '#f0b83a')
  b.box(-0.55, 0.03, 0.45, 0.1, 0.1, 0.1, '#f0b83a')
  b.box(0.7, 0.0, 0.15, 0.22, 0.09, 0.1, '#8a6a4a'); b.flowers(0.7, 0.15, 3, 0.16)
  b.tree(1.1, -1.0, 1.0, '#f2a1c0')
  b.bush(-1.05, 0.9, 0.14); b.bush(1.05, 0.7, 0.12, '#6dbb52')
  b.mailbox(0.55, 1.3, '#2c7a7b')
}
