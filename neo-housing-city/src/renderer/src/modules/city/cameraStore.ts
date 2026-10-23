// État de la caméra partagé entre la scène 3D (qui l'applique) et l'interface (boutons).
// L'objet `goal` est la cible ; la caméra s'en approche en douceur.

export const BASE_YAW = Math.PI / 4
export const ELEVATION = Math.atan(1 / Math.SQRT2) // 35,26° : vraie vue isométrique
export const ZOOM_MIN = 14
export const ZOOM_MAX = 90
export const ZOOM_DEFAULT = 26
export const PAN_LIMIT = 26

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const cameraStore = {
  goal: { x: 0, z: 0, yaw: BASE_YAW, zoom: ZOOM_DEFAULT },
  cur: { x: 0, z: 0, yaw: BASE_YAW, zoom: ZOOM_DEFAULT },
  keys: new Set<string>(),
  wake: (() => {}) as () => void,

  panBy(dx: number, dz: number) {
    this.goal.x = clamp(this.goal.x + dx, -PAN_LIMIT, PAN_LIMIT)
    this.goal.z = clamp(this.goal.z + dz, -PAN_LIMIT, PAN_LIMIT)
    this.wake()
  },
  zoomBy(factor: number) {
    this.goal.zoom = clamp(this.goal.zoom * factor, ZOOM_MIN, ZOOM_MAX)
    this.wake()
  },
  rotateFree(dyaw: number) {
    this.goal.yaw += dyaw
    this.wake()
  },
  // Rotation par quarts de tour, calée sur les 4 angles isométriques.
  rotateStep(steps: number) {
    const q = Math.PI / 2
    this.goal.yaw = (Math.round((this.goal.yaw - BASE_YAW) / q) + steps) * q + BASE_YAW
    this.wake()
  },
  reset() {
    const q = Math.PI * 2
    this.goal.x = 0
    this.goal.z = 0
    this.goal.zoom = ZOOM_DEFAULT
    this.goal.yaw = BASE_YAW + Math.round((this.goal.yaw - BASE_YAW) / q) * q
    this.wake()
  }
}
