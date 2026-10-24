import { Builder, type Vol } from './builder'

// Bâtiments VOISINS : ils donnent vie à la ville mais n'appartiennent pas à NEO HOUSING
// (pas de repère, pas de fiche, pas de chiffres). Chaque modèle a des variantes de couleurs.

const PASTEL = ['#f2d7b6', '#e9b9a0', '#cfe0e8', '#f5e6a8', '#d8e8c8', '#f0c4c4', '#e6d3f0']
const ROOFS = ['#b5503a', '#5b6b7a', '#7a4a3a', '#3f4651']

// Maisons mitoyennes : 3 façades étroites et colorées, pignon sur rue.
export function townhouses(b: Builder, v = 0) {
  b.lawn('#86c964')
  b.hedges('#4f9d44', 0, 3, 0.1) // haie seulement à l'arrière et sur les côtés
  const heights = [0.95, 1.1, 0.88]
  ;[-0.76, 0, 0.76].forEach((x, i) => {
    const wall = PASTEL[(i * 2 + v * 3) % PASTEL.length]
    const roof = ROOFS[(i + v) % ROOFS.length]
    const h = heights[(i + v) % 3]
    const vol: Vol = { cx: x, cz: -0.4, hx: 0.36, hz: 0.6 }
    b.box(x, 0, -0.4, 0.74, 0.05, 1.22, '#9b958b')
    b.box(x, 0.05, -0.4, 0.72, h, 1.2, wall)
    b.gable(x, 0.05 + h, -0.4, 1.3, 0.8, 0.42, roof, 'z')
    b.box(x, 0.05 + h, 0.2, 0.74, 0.04, 0.03, '#ffffff')
    b.door(vol, 'front', -0.16, 0.05, 0.17, 0.36, ['#2f5d50', '#7a2e2e', '#2f4a6b'][(i + v) % 3])
    b.window(vol, 'front', 0.15, 0.17, 0.2, 0.22, { cross: false })
    b.window(vol, 'front', 0, 0.55, 0.3, 0.24)
    b.box(x + 0.15, 0.13, 0.25, 0.24, 0.06, 0.07, '#8a6a4a')
    b.flowers(x + 0.15, 0.27, 3, 0.18, ['#ff6b8b', '#ffd166', '#ffffff'])
    b.path(-0.16 + x, 0.2, 1.45, 0.2, '#d6cfc0')
  })
  b.tree(-1.15, -1.15, 0.9, '#6dbb52'); b.tree(1.15, -1.15, 1.0, '#88c24d')
  b.mailbox(0.4, 1.35, '#2c7a7b')
}

// Café de quartier : grande vitrine, auvent rayé, terrasse avec parasols.
export function cafe(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.55, hx: 1.1, hz: 0.6 }
  b.box(0, -0.004, 0.6, 3.1, 0.012, 1.9, '#d9cfba') // terrasse pavée
  b.box(0, 0, -0.55, 2.24, 0.05, 1.24, '#9b958b')
  b.box(0, 0.05, -0.55, 2.2, 0.62, 1.2, '#f3e2c7')
  b.box(0, 0.67, -0.55, 2.2, 0.5, 1.2, '#efd6b0')
  b.box(0, 0.66, -0.55, 2.26, 0.04, 1.26, '#ffffff')
  b.gable(0, 1.17, -0.55, 2.4, 1.4, 0.45, '#b5503a', 'x')
  b.chimney(0.7, 1.3, -0.8, 0.28)
  // vitrine + porte
  b.wallBox(v, 'front', -0.35, 0.08, 1.15, 0.48, 0.03, -0.005, '#3b2a20')
  b.wallBox(v, 'front', -0.35, 0.1, 1.08, 0.44, 0.04, -0.005, '#9fd3ea', 'glass')
  b.door(v, 'front', 0.6, 0.05, 0.22, 0.44, '#3b2a20', '#3b2a20')
  b.wallBox(v, 'front', 0, 0.68, 0.9, 0.12, 0.03, 0, '#2f5d50') // enseigne
  b.wallBox(v, 'front', 0, 0.7, 0.7, 0.07, 0.035, 0.005, '#f7c948')
  // auvent rayé
  for (let i = 0; i < 11; i++) b.boxRot(-1.0 + i * 0.2, 0.62, 0.22, 0.2, 0.02, 0.48, 0.38, 0, 0, i % 2 ? '#ffffff' : '#d64545')
  for (const x of [-0.6, 0.15]) b.window(v, 'front', x, 0.8, 0.28, 0.26, { shutter: '#2f5d50' })
  b.window(v, 'right', 0, 0.8, 0.26, 0.26)
  b.window(v, 'left', 0, 0.8, 0.26, 0.26)
  b.window(v, 'right', 0, 0.2, 0.3, 0.3, { cross: false })
  // terrasse : tables, chaises, parasols
  const cols = ['#d64545', '#2f5d50', '#f7c948']
  ;[[-0.95, 0.75], [0, 0.95], [0.95, 0.75]].forEach(([x, z], i) => {
    b.cyl(x, 0, z, 0.012, 0.18, '#555b63', 5); b.cyl(x, 0.18, z, 0.15, 0.015, '#ffffff', 14)
    for (const dx of [-0.22, 0.22]) b.box(x + dx, 0, z, 0.1, 0.12, 0.1, '#3b2a20')
    b.parasol(x, z, cols[i], 0)
  })
  for (const x of [-1.4, 1.4]) { b.cyl(x, 0, 1.3, 0.1, 0.16, '#b9724a', 8, 0.12); b.ball(x, 0.26, 1.3, 0.13, '#4f9d44') }
}

// Boulangerie : vitrine, auvent bleu, appartement à l'étage.
export function bakery(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.5, hx: 0.95, hz: 0.62 }
  b.box(0, -0.004, 0.7, 3.1, 0.012, 1.7, '#d9cfba')
  b.box(0, 0, -0.5, 1.94, 0.05, 1.28, '#9b958b')
  b.box(0, 0.05, -0.5, 1.9, 0.6, 1.24, '#fbe7c6')
  b.box(0, 0.65, -0.5, 1.9, 0.55, 1.24, '#cfe0e8')
  b.hip(0, 1.2, -0.5, 2.06, 1.4, 0.4, '#5b6b7a')
  b.wallBox(v, 'front', -0.3, 0.1, 0.9, 0.42, 0.03, -0.005, '#ffffff')
  b.wallBox(v, 'front', -0.3, 0.12, 0.84, 0.38, 0.04, -0.005, '#9fd3ea', 'glass')
  for (let i = 0; i < 3; i++) b.wallBox(v, 'front', -0.6 + i * 0.3, 0.14, 0.18, 0.06, 0.12, 0.0, ['#c88a3a', '#e0b070', '#a86a2a'][i]) // pains en vitrine
  b.door(v, 'front', 0.55, 0.05, 0.22, 0.42, '#2f4a6b')
  b.wallBox(v, 'front', 0, 0.66, 1.1, 0.11, 0.03, 0, '#c88a3a')
  for (let i = 0; i < 9; i++) b.boxRot(-0.8 + i * 0.2, 0.58, 0.2, 0.2, 0.02, 0.42, 0.38, 0, 0, i % 2 ? '#ffffff' : '#3a7bd5')
  for (const x of [-0.5, 0, 0.5]) { b.window(v, 'front', x, 0.82, 0.22, 0.26, { shutter: '#3a7bd5' }); b.wallBox(v, 'front', x, 0.76, 0.24, 0.05, 0.06, 0, '#8a6a4a') }
  b.window(v, 'right', 0, 0.82, 0.22, 0.26); b.window(v, 'left', 0, 0.82, 0.22, 0.26)
  b.box(-1.15, 0, 0.9, 0.5, 0.12, 0.16, '#8a6a4a'); b.box(-1.15, 0.12, 0.98, 0.5, 0.12, 0.03, '#8a6a4a') // banc
  b.cyl(1.2, 0, 0.9, 0.012, 0.2, '#555b63', 5); b.box(1.2, 0.2, 0.9, 0.3, 0.18, 0.03, '#ffffff') // panneau
  b.tree(1.25, -1.2, 0.9)
}

// Cottage : murs en pierre claire, toit à quatre pans, porche, clôture blanche.
export function cottage(b: Builder, v = 0) {
  const wall = ['#e8dcc4', '#f0e2cf', '#dfe6d6'][v % 3]
  const roof = ['#7a4a3a', '#4a5866', '#8c3a28'][v % 3]
  const vol: Vol = { cx: 0, cz: -0.45, hx: 0.75, hz: 0.6 }
  b.lawn('#8dd06a')
  b.path(0, 0.15, 1.45, 0.24, '#d9cfba')
  for (let i = 0; i < 12; i++) { const x = -1.42 + i * 0.26; if (Math.abs(x) > 0.2) b.box(x, 0, 1.42, 0.035, 0.18, 0.035, '#ffffff') }
  b.box(-0.82, 0.12, 1.42, 1.2, 0.025, 0.02, '#ffffff'); b.box(0.82, 0.12, 1.42, 1.2, 0.025, 0.02, '#ffffff')
  b.box(0, 0, -0.45, 1.54, 0.05, 1.24, '#9b958b')
  b.box(0, 0.05, -0.45, 1.5, 0.68, 1.2, wall)
  b.hip(0, 0.73, -0.45, 1.75, 1.45, 0.55, roof)
  b.chimney(-0.45, 0.9, -0.7, 0.32, '#8f8a82')
  b.wallBox(vol, 'front', 0, 0.05, 0.5, 0.04, 0.3, 0, '#b9b3a8')
  b.wallBox(vol, 'front', 0, 0.48, 0.52, 0.03, 0.3, 0, roof)
  for (const s of [-1, 1]) b.wallBox(vol, 'front', s * 0.22, 0.09, 0.03, 0.39, 0.03, 0.27, '#ffffff')
  b.door(vol, 'front', 0, 0.05, 0.2, 0.38, ['#5b8c5a', '#c0392b', '#2f4a6b'][v % 3])
  for (const s of [-1, 1]) { b.window(vol, 'front', s * 0.48, 0.28, 0.2, 0.24); b.wallBox(vol, 'front', s * 0.48, 0.22, 0.24, 0.05, 0.06, 0, '#8a6a4a') }
  b.window(vol, 'right', 0, 0.28, 0.2, 0.24); b.window(vol, 'left', 0, 0.28, 0.2, 0.24); b.window(vol, 'back', 0, 0.28, 0.2, 0.24)
  b.tree(-1.1, 0.7, 1.0, ['#f2a1c0', '#e3a93c', '#6dbb52'][v % 3])
  b.bush(1.05, 0.5, 0.15); b.bush(1.1, 0.95, 0.12, '#6dbb52')
  b.flowers(0.75, 0.25, 5, 0.5)
}

// Maison moderne : volumes blancs et bois, toits plats, voiture dans l'allée.
export function modernCube(b: Builder, v = 0) {
  const accent = ['#b8844f', '#3f4651', '#c96f4a'][v % 3]
  const g: Vol = { cx: -0.25, cz: -0.5, hx: 0.85, hz: 0.6 }
  b.lawn('#80c25f')
  b.box(0.95, -0.004, 0.5, 0.75, 0.014, 1.9, '#bfbab0') // allée
  b.car(0.95, 0.75, 0, ['#e74c3c', '#ecf0f1', '#3498db'][v % 3])
  b.box(-0.25, 0, -0.5, 1.7, 0.52, 1.2, '#f5f5f2')
  b.box(-0.55, 0.52, -0.55, 1.1, 0.45, 1.0, accent)
  b.box(-0.25, 0.52, -0.5, 1.76, 0.04, 1.26, '#2e333b')
  b.box(-0.55, 0.97, -0.55, 1.18, 0.05, 1.08, '#2e333b')
  b.box(0.35, 0.56, -0.5, 0.5, 0.03, 0.5, '#7fbf5f') // toit végétalisé
  b.wallBox(g, 'front', -0.35, 0.05, 0.9, 0.42, 0.04, -0.005, '#9fd3ea', 'glass')
  b.wallBox(g, 'front', -0.35, 0.05, 0.02, 0.42, 0.012, 0.035, '#2e333b')
  b.door(g, 'front', 0.5, 0.02, 0.2, 0.42, '#2b2f36', '#2b2f36')
  b.wallBox({ cx: -0.55, cz: -0.55, hx: 0.55, hz: 0.5 }, 'front', 0, 0.58, 0.8, 0.26, 0.04, -0.005, '#9fd3ea', 'glass')
  b.window(g, 'left', 0, 0.12, 0.4, 0.28, { sill: false, frame: '#2e333b' })
  for (let i = 0; i < 4; i++) b.box(-0.2 + i * 0.22, -0.004, 0.45 + (i % 2) * 0.12, 0.18, 0.014, 0.18, '#d9d9d9')
  b.ball(-1.15, 0.12, 0.3, 0.12, '#3f8f4a'); b.ball(-1.15, 0.12, 0.7, 0.12, '#3f8f4a'); b.ball(-1.15, 0.12, 1.1, 0.12, '#3f8f4a')
  b.tree(-1.1, -1.15, 1.05, '#88c24d')
}

// Résidence moderne : 3 niveaux, balcons vitrés colorés, toit-terrasse planté.
export function residence(b: Builder, v = 0) {
  const accent = ['#f7c948', '#35b6a8', '#ff8a65'][v % 3]
  const vol: Vol = { cx: 0, cz: -0.45, hx: 1.15, hz: 0.68 }
  b.lawn('#86c964')
  b.path(0, 0.25, 1.45, 0.4, '#d6d1c7')
  b.hedges('#4f9d44', 0, 0.55, 0.12)
  b.box(0, 0, -0.45, 2.3, 1.62, 1.36, '#f2f2ef')
  b.box(0, 1.62, -0.45, 2.36, 0.06, 1.42, '#3f4651')
  b.box(-0.5, 1.68, -0.6, 0.8, 0.05, 0.7, '#7fbf5f')
  b.box(0.6, 1.68, -0.6, 0.5, 0.2, 0.4, '#c9ced4') // local technique
  for (let f = 0; f < 3; f++) {
    const y = 0.12 + f * 0.52
    for (const x of [-0.8, -0.27, 0.27, 0.8]) {
      b.wallBox(vol, 'front', x, y, 0.36, 0.36, 0.04, -0.005, '#9fd3ea', 'glass')
      b.wallBox(vol, 'front', x, y, 0.36, 0.02, 0.03, -0.01, '#3f4651')
    }
    if (f > 0) {
      for (const x of [-0.53, 0.53]) {
        b.wallBox(vol, 'front', x, y - 0.03, 0.95, 0.03, 0.22, 0, '#d9d9d9')
        b.wallBox(vol, 'front', x, y, 0.95, 0.14, 0.01, 0.21, '#bfe4f2', 'glass')
        b.wallBox(vol, 'front', x, y + 0.14, 0.95, 0.015, 0.02, 0.2, accent)
      }
    }
    for (const s of ['left', 'right'] as const) for (const a of [-0.25, 0.25]) b.wallBox(vol, s, a, y, 0.3, 0.32, 0.04, -0.005, '#9fd3ea', 'glass')
  }
  b.wallBox(vol, 'front', 0, 0, 0.36, 0.1, 0.04, 0, accent)
  b.door(vol, 'front', 0, 0.02, 0.26, 0.4, '#3f4651', accent)
  for (let i = 0; i < 3; i++) b.wallBox(vol, 'front', 0.3, 0.12, 0.05, 0.25, 0.08, 0, '#9aa3ad') // vélos (stationnement)
  b.tree(-1.2, 0.85, 1.1, '#6dbb52'); b.tree(1.2, 0.85, 1.0, '#88c24d')
  b.flowers(-0.6, 1.0, 6, 0.6); b.flowers(0.6, 1.0, 6, 0.6, ['#ffd166', '#ffffff'])
}
