import { Builder, type Vol } from './builder'

// Villa moderne : volumes cubiques blancs et anthracite, toits plats, baies vitrées,
// bardage bois, terrasse avec piscine.
export function modernVilla(b: Builder) {
  const g: Vol = { cx: 0, cz: -0.55, hx: 0.95, hz: 0.6 }
  const u: Vol = { cx: -0.3, cz: -0.35, hx: 0.58, hz: 0.55 }
  b.lawn('#80c25f')
  b.hedges('#3f8f4a', 0.55, 0.3, 0.12)
  // volumes
  b.box(0, 0, -0.55, 1.9, 0.5, 1.2, '#f3f3f0')
  b.box(-0.3, 0.5, -0.35, 1.16, 0.45, 1.1, '#3f4651')
  b.box(0.35, 0.5, -0.55, 1.26, 0.04, 1.28, '#2e333b') // toit du rez
  b.box(-0.3, 0.95, -0.35, 1.26, 0.05, 1.2, '#2e333b') // toit étage
  b.box(0.4, 0.5, -0.5, 0.22, 0.02, 0.22, '#9aa3ad')
  for (let i = 0; i < 3; i++) b.boxRot(-0.55 + i * 0.35, 1.03 - 0.0, -0.4, 0.3, 0.015, 0.22, -0.35, 0, 0, '#1f3b63')
  // bardage bois + porte
  b.wallBox(g, 'front', 0.6, 0, 0.55, 0.5, 0.02, 0, '#b8844f')
  b.door(g, 'front', 0.6, 0.02, 0.2, 0.42, '#2b2f36', '#2b2f36')
  b.wallBox(g, 'front', 0.6, 0.5, 0.5, 0.025, 0.2, 0, '#2e333b')
  // grandes baies
  b.wallBox(g, 'front', -0.4, 0.04, 0.95, 0.42, 0.03, -0.005, '#2e333b')
  b.wallBox(g, 'front', -0.4, 0.05, 0.9, 0.4, 0.04, -0.005, '#9fd3ea', 'glass')
  b.wallBox(g, 'front', -0.4, 0.05, 0.018, 0.4, 0.012, 0.035, '#2e333b')
  b.wallBox(u, 'front', 0, 0.52, 0.95, 0.27, 0.04, -0.005, '#9fd3ea', 'glass')
  b.wallBox(u, 'front', 0, 0.52, 0.018, 0.27, 0.012, 0.035, '#e9e9e6')
  b.wallBox(u, 'front', 0, 0.8, 1.0, 0.025, 0.03, -0.01, '#e9e9e6')
  b.wallBox(u, 'front', 0, 0.5, 1.0, 0.025, 0.03, -0.01, '#e9e9e6')
  b.window(g, 'right', 0, 0.12, 0.3, 0.24, { sill: false, frame: '#2e333b' })
  b.window(u, 'left', 0.1, 0.55, 0.3, 0.2, { sill: false, frame: '#e9e9e6' })
  b.window(u, 'back', 0, 0.55, 0.4, 0.2, { sill: false, frame: '#e9e9e6' })
  b.window(g, 'back', 0.3, 0.12, 0.3, 0.24, { sill: false, frame: '#2e333b' })
  // terrasse + piscine
  b.box(0.45, 0, 0.6, 1.0, 0.03, 0.6, '#a97a4a')
  b.box(0.45, 0.03, 0.62, 0.74, 0.018, 0.34, '#f3f3f0')
  b.box(0.45, 0.035, 0.62, 0.66, 0.02, 0.26, '#46b8e0')
  b.box(-0.3, 0.03, 0.55, 0.16, 0.04, 0.34, '#f3f3f0')
  b.box(-0.55, 0.03, 0.55, 0.16, 0.04, 0.34, '#f3f3f0')
  // dalles du chemin
  for (let i = 0; i < 5; i++) b.box(0.6, -0.004, 0.2 + i * 0.26, 0.28, 0.014, 0.18, '#cfcfcf')
  b.ball(-1.15, 0.12, 0.4, 0.12, '#3f8f4a'); b.ball(-1.15, 0.12, 0.8, 0.12, '#3f8f4a'); b.ball(-1.15, 0.12, 1.2, 0.12, '#3f8f4a')
  b.tree(-1.1, -1.05, 1.1, '#6dbb52')
  b.tree(1.15, -1.0, 0.9, '#88c24d')
  b.flowers(-0.75, 1.1, 6, 0.8, ['#ffffff', '#ffd166'])
}
