import { Builder, type Vol } from './builder'

// Maison bel étage : soubassement en pierre, grand escalier, étage noble haut de plafond avec balcon,
// toit en ardoise à quatre pans avec lucarne.
export function upperFloor(b: Builder) {
  const v: Vol = { cx: 0, cz: -0.5, hx: 0.9, hz: 0.68 }
  b.lawn('#8cce68')
  b.path(0, 0.3, 1.45, 0.4, '#d9cfba')
  b.hedges('#3f8f4a', 0, 0.5)
  b.box(0, 0, -0.5, 1.8, 0.3, 1.36, '#bfb5a2')
  b.box(0, 0.3, -0.5, 1.8, 0.62, 1.36, '#f4eddc')
  b.box(0, 0.3, -0.5, 1.88, 0.035, 1.44, '#ffffff')
  b.hip(0, 0.92, -0.5, 2.0, 1.56, 0.42, '#58687a')
  b.chimney(0.55, 1.05, -0.7, 0.28, '#b08a70')
  b.chimney(-0.55, 1.05, -0.7, 0.28, '#b08a70')
  // lucarne
  b.box(0, 1.0, -0.12, 0.26, 0.18, 0.22, '#f4eddc')
  b.gable(0, 1.18, -0.12, 0.26, 0.34, 0.12, '#58687a', 'z')
  // pilastres d'angle
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(sx * 0.9, 0.3, -0.5 + sz * 0.68, 0.06, 0.62, 0.06, '#ffffff')
  // escalier d'honneur
  for (let i = 0; i < 3; i++) b.wallBox(v, 'front', 0, 0, 0.5, (i + 1) * 0.1, (3 - i) * 0.09, 0, '#cfc8b8')
  b.door(v, 'front', 0, 0.3, 0.24, 0.42, '#2f4a6b')
  b.wallBox(v, 'front', 0, 0.74, 0.3, 0.03, 0.04, 0, '#9fd3ea', 'glass')
  for (const s of [-1, 1]) b.wallBox(v, 'front', s * 0.5, 0.3, 0.025, 0.4, 0.035, 0.0, '#c9c0ad')
  // fenêtres hautes de l'étage noble + balcon filant
  for (const s of [-1, 1]) {
    b.window(v, 'front', s * 0.5, 0.38, 0.2, 0.4)
    b.wallBox(v, 'front', s * 0.5, 0.33, 0.34, 0.03, 0.12, 0, '#ffffff')
    b.railing(v, 'front', s * 0.5, 0.36, 0.3, '#2b2f36', 0.1, 0.1)
  }
  // soubassement
  for (const s of [-1, 1]) b.window(v, 'front', s * 0.6, 0.1, 0.16, 0.12, { cross: false, frame: '#e9e2d2' })
  b.window(v, 'right', 0, 0.38, 0.2, 0.4)
  b.window(v, 'right', -0.35, 0.38, 0.2, 0.4)
  b.window(v, 'left', 0, 0.38, 0.2, 0.4)
  b.window(v, 'left', -0.35, 0.38, 0.2, 0.4)
  b.window(v, 'right', 0, 0.08, 0.16, 0.12, { cross: false })
  b.window(v, 'back', 0, 0.38, 0.2, 0.4)
  // jardin
  for (const s of [-1, 1]) {
    b.cyl(s * 0.45, 0, 0.55, 0.07, 0.1, '#b9724a', 8, 0.09)
    b.ball(s * 0.45, 0.2, 0.55, 0.1, '#3f8f4a')
  }
  b.flowers(-0.95, 0.9, 5, 0.6, ['#ff6b8b', '#ffffff', '#ffb3c7'])
  b.flowers(0.95, 0.9, 5, 0.6, ['#b388ff', '#ffffff', '#d9c2ff'])
  b.tree(1.15, 0.8, 1.2, '#e3a93c')
  b.bush(-1.15, 0.2, 0.15, '#3f8f4a')
  b.mailbox(0.45, 1.3, '#1d3557')
}
