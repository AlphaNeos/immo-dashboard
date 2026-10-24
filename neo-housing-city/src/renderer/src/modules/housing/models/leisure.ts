import { Builder } from './builder'

// Équipements de loisirs sur les grands terrains (6 x 6).

// Club de padel : 2 terrains bleus, murs vitrés aux extrémités, grillage, filet, projecteurs, petit club-house.
export function padel(b: Builder) {
  b.lawn('#7cc160', 5.9)
  b.box(0, -0.004, 0, 5.8, 0.014, 5.4, '#d6d1c7')
  for (const cx of [-1.4, 1.4]) {
    const w = 2.3, l = 4.4, cz = -0.45
    b.box(cx, 0.01, cz, w, 0.02, l, '#2a6fb5')
    const line = (x: number, z: number, lw: number, ld: number) => b.box(cx + x, 0.03, cz + z, lw, 0.006, ld, '#ffffff')
    line(0, -l / 2 + 0.02, w, 0.03); line(0, l / 2 - 0.02, w, 0.03) // fonds
    line(0, -1.5, w, 0.025); line(0, 1.5, w, 0.025) // lignes de service
    line(0, -0.75, 0.025, 1.5); line(0, 0.75, 0.025, 1.5) // ligne centrale
    // filet
    b.box(cx, 0.03, cz, w, 0.11, 0.015, '#1f2933'); b.box(cx, 0.14, cz, w, 0.018, 0.025, '#ffffff')
    for (const s of [-1, 1]) b.cyl(cx + s * (w / 2), 0, cz, 0.02, 0.16, '#555b63', 6)
    // murs vitrés au fond, grillage sur les côtés
    for (const s of [-1, 1]) {
      b.box(cx, 0.02, cz + s * (l / 2), w, 0.42, 0.03, '#bfe4f2', 'glass')
      b.box(cx, 0.44, cz + s * (l / 2), w, 0.02, 0.04, '#2b2f36')
      for (let i = 0; i <= 6; i++) b.box(cx - w / 2 + (w * i) / 6, 0.02, cz + s * (l / 2), 0.025, 0.62, 0.025, '#2b2f36')
      b.box(cx + s * (w / 2), 0.02, cz, 0.012, 0.32, l, '#5d6b78')
      b.box(cx + s * (w / 2), 0.34, cz, 0.03, 0.02, l, '#2b2f36')
      for (let i = 0; i <= 8; i++) b.box(cx + s * (w / 2), 0.02, cz - l / 2 + (l * i) / 8, 0.025, 0.34, 0.025, '#2b2f36')
    }
    // projecteurs
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      b.cyl(cx + sx * (w / 2 + 0.08), 0, cz + sz * (l / 2 - 0.4), 0.025, 1.05, '#3b4252', 6)
      b.box(cx + sx * (w / 2 + 0.02), 1.02, cz + sz * (l / 2 - 0.4), 0.14, 0.06, 0.1, '#f5f5f0')
    }
  }
  // club-house + bancs
  b.box(0, 0, 2.35, 2.2, 0.5, 0.7, '#f5f5f2')
  b.box(0, 0.5, 2.35, 2.3, 0.05, 0.8, '#2a6fb5')
  b.box(-0.3, 0.05, 2.705, 1.0, 0.36, 0.02, '#9fd3ea', 'glass')
  b.box(0.65, 0.02, 2.705, 0.24, 0.42, 0.02, '#2b2f36')
  for (const x of [-2.4, 2.4]) { b.box(x, 0, 2.35, 0.6, 0.1, 0.16, '#b9824a'); b.parasol(x, 2.0, '#2a6fb5') }
  b.tree(-2.6, -2.6, 1.0); b.tree(2.6, -2.6, 1.1, '#88c24d')
}

// Piscine municipale : grand bassin à 4 lignes d'eau, pataugeoire, plongeoir, transats, parasols, vestiaires.
export function pool(b: Builder) {
  b.lawn('#7cc160', 5.9)
  b.box(0, -0.004, 0.1, 5.6, 0.02, 5.2, '#ece3cf') // plage
  // bassin
  b.box(-0.4, 0.016, -0.5, 3.6, 0.025, 2.4, '#ffffff')
  b.box(-0.4, 0.02, -0.5, 3.4, 0.026, 2.2, '#36b3e0')
  for (let i = 1; i < 4; i++) for (let k = 0; k < 17; k++) b.box(-2.05 + k * 0.2, 0.05, -1.6 + i * 0.55, 0.08, 0.02, 0.035, k % 2 ? '#ffffff' : '#e74c3c')
  for (const x of [-2.1, 1.3]) for (const s of [-0.2, 0.2]) b.box(x, 0.02, -1.7 + s, 0.02, 0.18, 0.02, '#c9ced4') // échelles
  // plongeoir
  b.box(1.45, 0.02, 0.4, 0.2, 0.18, 0.2, '#c9ced4'); b.box(1.25, 0.2, 0.4, 0.55, 0.03, 0.14, '#3a7bd5')
  // pataugeoire
  b.cyl(1.9, 0.016, -1.35, 0.62, 0.025, '#ffffff', 28); b.cyl(1.9, 0.02, -1.35, 0.55, 0.026, '#5fd0f0', 28)
  b.ball(1.9, 0.07, -1.35, 0.07, '#f7c948'); b.ball(1.75, 0.07, -1.25, 0.05, '#ff6b8b')
  // transats + parasols
  for (let i = 0; i < 5; i++) {
    const x = -2.3 + i * 0.75
    b.box(x, 0.02, 1.25, 0.24, 0.05, 0.55, '#ffffff'); b.boxRot(x, 0.13, 1.0, 0.24, 0.03, 0.2, -0.6, 0, 0, '#ffffff')
    b.box(x, 0.075, 1.3, 0.22, 0.012, 0.4, ['#3a7bd5', '#f7c948', '#ff6b8b'][i % 3])
    if (i % 2 === 0) b.parasol(x + 0.37, 1.35, ['#ff6b8b', '#3a7bd5', '#f7c948'][(i / 2) % 3])
  }
  // vestiaires
  b.box(0, 0, 2.35, 3.2, 0.48, 0.65, '#ffffff')
  b.box(0, 0.48, 2.35, 3.3, 0.05, 0.75, '#3a7bd5')
  for (let i = 0; i < 6; i++) b.box(-1.25 + i * 0.5, 0.06, 2.025, 0.3, 0.32, 0.02, ['#3a7bd5', '#36b3e0'][i % 2])
  // clôture basse
  for (let i = 0; i < 23; i++) { const x = -2.85 + i * 0.26; b.box(x, 0, -2.85, 0.03, 0.2, 0.03, '#ffffff'); b.box(-2.85, 0, x, 0.03, 0.2, 0.03, '#ffffff'); b.box(2.85, 0, x, 0.03, 0.2, 0.03, '#ffffff') }
  b.box(0, 0.16, -2.85, 5.7, 0.025, 0.02, '#ffffff'); b.box(-2.85, 0.16, 0, 0.02, 0.025, 5.7, '#ffffff'); b.box(2.85, 0.16, 0, 0.02, 0.025, 5.7, '#ffffff')
  b.tree(-2.55, 2.0, 0.95, '#6dbb52'); b.tree(2.55, 2.0, 1.0, '#88c24d')
}

// Aire de jeux + mini terrain de basket.
export function playground(b: Builder) {
  b.lawn('#86c964', 5.9)
  b.box(-1.35, -0.002, -1.1, 2.6, 0.016, 2.8, '#e6cf9a') // sable
  // toboggan
  b.box(-2.0, 0, -1.8, 0.4, 0.5, 0.4, '#ff6b8b')
  b.box(-2.0, 0.5, -1.8, 0.46, 0.04, 0.46, '#f7c948')
  b.boxRot(-1.45, 0.27, -1.8, 0.85, 0.03, 0.26, 0, 0, -0.62, '#3a7bd5')
  for (let i = 0; i < 4; i++) b.box(-2.28, i * 0.12, -1.8, 0.04, 0.03, 0.3, '#ffffff')
  // balançoire
  b.boxRot(-0.9, 0.35, -0.6, 0.04, 0.75, 0.04, 0, 0, 0.3, '#3b4252'); b.boxRot(-0.9, 0.35, -0.6, 0.04, 0.75, 0.04, 0, 0, -0.3, '#3b4252')
  b.boxRot(-0.9, 0.35, 0.4, 0.04, 0.75, 0.04, 0, 0, 0.3, '#3b4252'); b.boxRot(-0.9, 0.35, 0.4, 0.04, 0.75, 0.04, 0, 0, -0.3, '#3b4252')
  b.box(-0.9, 0.7, -0.1, 0.05, 0.05, 1.05, '#3b4252')
  for (const z of [-0.35, 0.15]) { b.box(-0.9, 0.2, z, 0.012, 0.5, 0.012, '#888'); b.box(-0.9, 0.18, z, 0.12, 0.03, 0.16, '#ff8a65') }
  // bac à sable + jouets
  b.box(-2.0, 0, -0.2, 0.9, 0.08, 0.9, '#b88a54'); b.box(-2.0, 0.02, -0.2, 0.8, 0.07, 0.8, '#f0dca8')
  b.ball(-2.1, 0.11, -0.3, 0.05, '#e74c3c'); b.box(-1.85, 0.09, -0.1, 0.08, 0.05, 0.06, '#3a7bd5')
  // tourniquet
  b.cyl(-1.35, 0, 0.9, 0.38, 0.05, '#f7c948', 20); b.cyl(-1.35, 0.05, 0.9, 0.02, 0.25, '#3b4252', 6)
  // terrain de basket
  b.box(1.45, 0, -0.2, 2.6, 0.02, 3.6, '#e07b39')
  const L = (x: number, z: number, w: number, d: number) => b.box(1.45 + x, 0.022, -0.2 + z, w, 0.006, d, '#ffffff')
  L(0, -1.78, 2.6, 0.03); L(0, 1.78, 2.6, 0.03); L(-1.28, 0, 0.03, 3.6); L(1.28, 0, 0.03, 3.6); L(0, 0, 2.6, 0.03)
  for (const s of [-1, 1]) {
    L(0, s * 1.3, 0.8, 0.025)
    b.cyl(1.45, 0, -0.2 + s * 1.95, 0.025, 0.78, '#3b4252', 6)
    b.box(1.45, 0.62, -0.2 + s * 1.9, 0.42, 0.28, 0.025, '#ffffff')
    b.cyl(1.45, 0.6, -0.2 + s * 1.8, 0.09, 0.015, '#e74c3c', 14)
  }
  b.ball(1.2, 0.07, 0.3, 0.06, '#e07b39')
  // bancs, arbres, poubelle
  for (const z of [1.9, 2.4]) { b.box(-2.3, 0, z, 0.6, 0.1, 0.16, '#b9824a'); b.box(-2.3, 0.1, z + 0.07, 0.6, 0.12, 0.03, '#b9824a') }
  b.cyl(-1.6, 0, 2.1, 0.08, 0.2, '#4a7c59', 8)
  b.tree(-0.5, 2.3, 1.1, '#f2a1c0'); b.tree(2.6, 2.4, 1.0); b.tree(-2.6, 2.6, 0.9, '#88c24d'); b.tree(0.4, 2.55, 0.9, '#6dbb52')
}
