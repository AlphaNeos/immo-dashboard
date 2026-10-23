import { Color } from 'three'

// Ambiance lumineuse en fonction de l'heure (pure, sans 3D) : intensités, couleurs et dégradé du ciel.

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const c = (hex: string) => new Color(hex)

const SUN_DAY = c('#fff0d6')
const SUN_DUSK = c('#ff9d5c')
const SKY_DAY: [Color, Color] = [c('#8fcdee'), c('#e6f1e4')]
const SKY_NIGHT: [Color, Color] = [c('#0b1230'), c('#1d2958')]
const SKY_DUSK: [Color, Color] = [c('#4d6fa8'), c('#f2b27a')]
const HEMI_SKY = [c('#5a6fae'), c('#cfe8ff')]
const HEMI_GROUND = [c('#2f3d5c'), c('#7a9a58')]

export interface Lighting {
  day: number // 0 nuit - 1 plein jour
  night: number // 0 jour - 1 nuit profonde (allume lampadaires et fenêtres)
  sunIntensity: number
  sunColor: Color
  moonIntensity: number
  hemiIntensity: number
  hemiSky: Color
  hemiGround: Color
  skyTop: Color
  skyBottom: Color
}

export function nightAt(hours: number): number {
  return lightingAt(hours).night
}

export function lightingAt(hours: number): Lighting {
  const h = ((hours % 24) + 24) % 24
  const day = smooth(5, 7.5, h) * (1 - smooth(18, 20.5, h))
  const dusk = Math.min(1, smooth(5, 6.5, h) * (1 - smooth(7, 9, h)) + smooth(16.5, 18.5, h) * (1 - smooth(19, 20.5, h)))
  const night = 1 - smooth(0.15, 0.7, day)
  const skyTop = SKY_NIGHT[0].clone().lerp(SKY_DAY[0], day).lerp(SKY_DUSK[0], dusk * 0.8)
  const skyBottom = SKY_NIGHT[1].clone().lerp(SKY_DAY[1], day).lerp(SKY_DUSK[1], dusk * 0.8)
  return {
    day,
    night,
    sunIntensity: 2.4 * day,
    sunColor: SUN_DAY.clone().lerp(SUN_DUSK, dusk),
    moonIntensity: 1.5 * (1 - day),
    hemiIntensity: 0.95 + 0.15 * day,
    hemiSky: HEMI_SKY[0].clone().lerp(HEMI_SKY[1], day),
    hemiGround: HEMI_GROUND[0].clone().lerp(HEMI_GROUND[1], day),
    skyTop,
    skyBottom
  }
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours) % 24
  const m = Math.floor((hours - Math.floor(hours)) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
