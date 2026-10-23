import { ROADS_X, ROADS_Z, ROAD_W } from '../city/layout'

// Simulation de circulation (pure, sans 3D, déterministe).
// Les voitures roulent à droite, uniquement sur les voies des routes, entre les intersections de la grille.
// Chaque intersection n'accepte qu'une voiture à la fois : pas de collision ni de passage à travers.

export const LANE = ROAD_W / 4 // axe de la voie, à 0,6 du centre de la route
export const HALF_ROAD = ROAD_W / 2
export const CAR_LEN = 0.8
const STOP_BEFORE = 0.5 // le centre de la voiture s'arrête 0,5 avant la ligne
const ACCEL = 1.6
const BRAKE = 4.5

export interface Vec { x: number; z: number }
type Node = [number, number] // indices dans ROADS_X, ROADS_Z

const nodeKey = (n: Node) => `${n[0]},${n[1]}`
export const nodePos = (n: Node): Vec => ({ x: ROADS_X[n[0]], z: ROADS_Z[n[1]] })
const same = (a: Node, b: Node) => a[0] === b[0] && a[1] === b[1]

function neighbors(n: Node): Node[] {
  const out: Node[] = []
  if (n[0] > 0) out.push([n[0] - 1, n[1]])
  if (n[0] < ROADS_X.length - 1) out.push([n[0] + 1, n[1]])
  if (n[1] > 0) out.push([n[0], n[1] - 1])
  if (n[1] < ROADS_Z.length - 1) out.push([n[0], n[1] + 1])
  return out
}

const dirOf = (a: Node, b: Node): Vec => {
  const pa = nodePos(a), pb = nodePos(b)
  const l = Math.hypot(pb.x - pa.x, pb.z - pa.z)
  return { x: (pb.x - pa.x) / l, z: (pb.z - pa.z) / l }
}
const rightOf = (d: Vec): Vec => ({ x: -d.z, z: d.x }) // main droite d'un conducteur vu de dessus (x droite, z bas)

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface TurnPath { pts: Vec[]; cum: number[]; len: number }

function turnPath(a: Node, b: Node, c: Node): TurnPath {
  const din = dirOf(a, b), dout = dirOf(b, c)
  const rin = rightOf(din), rout = rightOf(dout)
  const B = nodePos(b)
  const E = { x: B.x + rin.x * LANE - din.x * HALF_ROAD, z: B.z + rin.z * LANE - din.z * HALF_ROAD }
  const X = { x: B.x + rout.x * LANE + dout.x * HALF_ROAD, z: B.z + rout.z * LANE + dout.z * HALF_ROAD }
  const straight = din.x === dout.x && din.z === dout.z
  const C = straight ? { x: (E.x + X.x) / 2, z: (E.z + X.z) / 2 } : { x: B.x + (rin.x + rout.x) * LANE, z: B.z + (rin.z + rout.z) * LANE }
  const n = straight ? 2 : 14
  const pts: Vec[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    pts.push({ x: u * u * E.x + 2 * u * t * C.x + t * t * X.x, z: u * u * E.z + 2 * u * t * C.z + t * t * X.z })
  }
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  return { pts, cum, len: cum[cum.length - 1] }
}

function edgeGeometry(a: Node, b: Node) {
  const d = dirOf(a, b), r = rightOf(d)
  const pa = nodePos(a), pb = nodePos(b)
  const total = Math.hypot(pb.x - pa.x, pb.z - pa.z)
  const p0 = { x: pa.x + d.x * HALF_ROAD + r.x * LANE, z: pa.z + d.z * HALF_ROAD + r.z * LANE }
  return { d, p0, len: total - 2 * HALF_ROAD }
}

export interface Car {
  id: number
  kind: number // 0 berline, 1 compacte, 2 utilitaire
  color: string
  a: Node
  b: Node
  next: Node
  s: number
  speed: number
  v0: number
  inTurn: boolean
  turn: TurnPath | null
  turnS: number
  stoppedFor: number
  x: number
  z: number
  yaw: number
  odo: number // distance parcourue (rotation des roues)
  turns: number // statistique : nombre de virages effectués
  braking: boolean
}

export const CAR_COLORS = ['#e74c3c', '#3498db', '#f1c40f', '#ecf0f1', '#2ecc71', '#e67e22', '#9b59b6', '#34495e', '#1abc9c', '#ff6b8b']

export class TrafficSim {
  cars: Car[] = []
  private locks = new Map<string, number>()
  private rnd: () => number

  constructor(count = 14, seed = 7) {
    this.rnd = mulberry32(seed)
    const nodes: Node[] = []
    for (let i = 0; i < ROADS_X.length; i++) for (let j = 0; j < ROADS_Z.length; j++) nodes.push([i, j])
    let guard = 0
    while (this.cars.length < count && guard++ < 2000) {
      const a = nodes[Math.floor(this.rnd() * nodes.length)]
      const nb = neighbors(a)
      const b = nb[Math.floor(this.rnd() * nb.length)]
      const { len } = edgeGeometry(a, b)
      const s = 0.5 + this.rnd() * (len - 1.5)
      if (this.cars.some((o) => same(o.a, a) && same(o.b, b) && Math.abs(o.s - s) < 2.2)) continue
      const car: Car = {
        id: this.cars.length, kind: this.cars.length % 3, color: CAR_COLORS[this.cars.length % CAR_COLORS.length],
        a, b, next: a, s, speed: 0, v0: 1.7 + this.rnd() * 0.5, inTurn: false, turn: null, turnS: 0,
        stoppedFor: 0, x: 0, z: 0, yaw: 0, odo: 0, turns: 0, braking: false
      }
      car.next = this.chooseNext(car)
      this.place(car)
      this.cars.push(car)
    }
  }

  private chooseNext(car: Car): Node {
    const opts = neighbors(car.b).filter((n) => !same(n, car.a))
    const din = dirOf(car.a, car.b)
    const weights = opts.map((n) => {
      const d = dirOf(car.b, n)
      return d.x === din.x && d.z === din.z ? 0.5 : 0.25
    })
    let r = this.rnd() * weights.reduce((x, y) => x + y, 0)
    for (let i = 0; i < opts.length; i++) { r -= weights[i]; if (r <= 0) return opts[i] }
    return opts[opts.length - 1]
  }

  private place(car: Car) {
    if (car.inTurn && car.turn) {
      const { pts, cum } = car.turn
      let i = 1
      while (i < cum.length - 1 && cum[i] < car.turnS) i++
      const t = (car.turnS - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])
      car.x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t
      car.z = pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t
      car.yaw = Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    } else {
      const g = edgeGeometry(car.a, car.b)
      car.x = g.p0.x + g.d.x * car.s
      car.z = g.p0.z + g.d.z * car.s
      car.yaw = Math.atan2(g.d.x, g.d.z)
    }
  }

  private exitClear(car: Car): boolean {
    return !this.cars.some((o) => o !== car && !o.inTurn && same(o.a, car.b) && same(o.b, car.next) && o.s < 1.5)
  }

  update(dt: number) {
    for (const car of this.cars) {
      let target = car.v0
      car.braking = false
      if (!car.inTurn) {
        const { len } = edgeGeometry(car.a, car.b)
        // véhicule devant, sur la même voie
        let gap = Infinity, leaderSpeed = 0
        for (const o of this.cars) {
          if (o === car || o.inTurn || !same(o.a, car.a) || !same(o.b, car.b) || o.s <= car.s) continue
          if (o.s - car.s < gap) { gap = o.s - car.s; leaderSpeed = o.speed }
        }
        const free = gap - CAR_LEN
        if (free < 4) {
          // vitesse maximale pour pouvoir s'arrêter derrière le véhicule de devant, même s'il freine
          const room = Math.max(0, free - 0.2)
          target = Math.min(target, Math.sqrt(leaderSpeed * leaderSpeed + 2 * BRAKE * 0.7 * room))
        }

        // intersection : on réserve avant de s'y engager
        const node = nodeKey(car.b)
        const holdAt = len - STOP_BEFORE
        const owner = this.locks.get(node)
        const mayEnter = (owner === undefined || owner === car.id) && this.exitClear(car)
        const toHold = holdAt - car.s
        if (owner === car.id) {
          // déjà autorisée : on continue jusqu'au virage
        } else if (gap === Infinity && toHold < 1.2 + (car.speed * car.speed) / (2 * BRAKE) && mayEnter) {
          this.locks.set(node, car.id)
        } else if (toHold < 1.4 + (car.speed * car.speed) / (2 * BRAKE)) {
          target = Math.min(target, Math.sqrt(Math.max(0, 2 * BRAKE * Math.max(0, toHold - 0.02))) * 0.9)
        }

        car.speed += Math.max(-BRAKE * dt, Math.min(ACCEL * dt, target - car.speed))
        if (car.speed < 0) car.speed = 0
        car.braking = target < car.speed - 0.05
        car.s += car.speed * dt
        car.odo += car.speed * dt
        const limit = this.locks.get(node) === car.id ? len : Math.min(len, holdAt + 0.02)
        if (car.s > limit) { car.s = limit; car.speed = 0 }
        if (this.locks.get(node) === car.id && car.s >= len - 1e-6) {
          car.inTurn = true
          car.turn = turnPath(car.a, car.b, car.next)
          car.turnS = 0
        }
      } else if (car.turn) {
        target = Math.min(car.v0, 1.1)
        car.speed += Math.max(-BRAKE * dt, Math.min(ACCEL * dt, target - car.speed))
        car.turnS += car.speed * dt
        car.odo += car.speed * dt
        if (car.turnS >= car.turn.len) {
          const over = car.turnS - car.turn.len
          this.locks.delete(nodeKey(car.b))
          const straight = dirOf(car.a, car.b).x === dirOf(car.b, car.next).x && dirOf(car.a, car.b).z === dirOf(car.b, car.next).z
          if (!straight) car.turns++
          car.a = car.b
          car.b = car.next
          car.s = over
          car.inTurn = false
          car.turn = null
          car.next = this.chooseNext(car)
        }
      }
      car.stoppedFor = car.speed < 0.05 ? car.stoppedFor + dt : 0
      this.place(car)
    }
  }
}

// La position (x, z) est-elle sur une route ? (utile pour les tests)
export function onRoad(x: number, z: number, margin = 0): boolean {
  const inX = ROADS_X.some((r) => Math.abs(x - r) <= HALF_ROAD + margin)
  const inZ = ROADS_Z.some((r) => Math.abs(z - r) <= HALF_ROAD + margin)
  return inX || inZ
}
