// Piétons : ils marchent en boucle sur le trottoir (anneau de 0,5 m) qui entoure chaque bloc urbain.
// Deux files : intérieure (sens horaire) et extérieure (sens inverse), jamais sur la route ni sur les lampadaires (à 3,75).

export const WALK_INNER = 3.58
export const WALK_OUTER = 3.92
export const WALK_SPEED = 0.34

export interface Walker {
  id: number
  block: number
  h: number // demi-côté de la boucle
  dir: 1 | -1
  s: number
  phase: number // pour le balancement des jambes
  x: number
  z: number
  yaw: number
  shirt: string
  pants: string
  skin: string
}

const SHIRTS = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#2ecc71', '#e67e22', '#9b59b6', '#ff6b8b', '#1abc9c']
const PANTS = ['#2c3e50', '#34495e', '#5d4037', '#37474f', '#1f2d3d']
const SKINS = ['#f5cba7', '#e0ac69', '#c68642', '#8d5524', '#ffdbac']

export function positionOnLoop(h: number, s: number, dir: 1 | -1, cx: number, cz: number) {
  const P = 8 * h
  const t = ((s % P) + P) % P
  const side = Math.floor(t / (2 * h))
  const u = t - side * 2 * h - h
  let x = 0, z = 0, dx = 0, dz = 0
  if (side === 0) { x = u; z = -h; dx = 1 }
  else if (side === 1) { x = h; z = u; dz = 1 }
  else if (side === 2) { x = -u; z = h; dx = -1 }
  else { x = -h; z = -u; dz = -1 }
  return { x: cx + x, z: cz + z, yaw: Math.atan2(dx * dir, dz * dir) }
}

export class PedestrianSim {
  walkers: Walker[] = []
  constructor(private centers: { x: number; z: number }[], perBlock = 2) {
    let id = 0
    centers.forEach((_, block) => {
      for (let k = 0; k < perBlock; k++) {
        const outer = k % 2 === 1
        const h = outer ? WALK_OUTER : WALK_INNER
        const w: Walker = {
          id, block, h, dir: outer ? -1 : 1, s: (k * 4 + block * 1.7) % (8 * h) + (id % 3) * 3,
          phase: id * 1.3, x: 0, z: 0, yaw: 0,
          shirt: SHIRTS[id % SHIRTS.length], pants: PANTS[id % PANTS.length], skin: SKINS[id % SKINS.length]
        }
        this.walkers.push(w)
        this.move(w, 0)
        id++
      }
    })
  }
  private move(w: Walker, dt: number) {
    w.s += WALK_SPEED * dt * w.dir
    w.phase += dt * 7
    const c = this.centers[w.block]
    const p = positionOnLoop(w.h, w.s, w.dir, c.x, c.z)
    w.x = p.x; w.z = p.z; w.yaw = p.yaw
  }
  update(dt: number) {
    for (const w of this.walkers) this.move(w, dt)
  }
}
