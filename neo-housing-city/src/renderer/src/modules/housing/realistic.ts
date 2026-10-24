import { BufferAttribute, BufferGeometry, SRGBColorSpace, TextureLoader, type Texture } from 'three'

// Modèles 3D réalistes (générés avec Higgsfield puis compactés par scripts/convert-glb.mjs).
// Ils remplacent la maquette d'un de VOS logements ; tout le reste (fiche, repère, pièces) est inchangé.
export interface RealModelData {
  version: 1
  vertices: number
  triangles: number
  min: number[]
  extent: number[]
  positions: string
  normals: string
  uvs: string
  index: string
  index32: boolean
  texture: string | null
}

// bâtiment -> modèle (chargé à la demande pour ne pas ralentir le démarrage)
const SOURCES: Record<string, () => Promise<{ default: RealModelData }>> = {
  'bld-001': () => import('./realistic/bld-001.json') as Promise<{ default: RealModelData }>, // Rue du Fisch Club 41
  'bld-005': () => import('./realistic/bld-005.json') as Promise<{ default: RealModelData }>, // Maison A, Avenue de l'Hôpital 43 (villa moderne)
}

export const hasRealistic = (buildingId: string) => buildingId in SOURCES

const bytes = (b64: string) => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function decode(d: RealModelData): { geometry: BufferGeometry; height: number } {
  const q = new Int16Array(bytes(d.positions).buffer)
  const pos = new Float32Array(q.length)
  for (let i = 0; i < q.length; i++) { const k = i % 3; pos[i] = d.min[k] + ((q[i] + 32768) / 65535) * d.extent[k] }
  const n8 = new Int8Array(bytes(d.normals).buffer)
  const nor = Float32Array.from(n8, (v) => v / 127)
  const u16 = new Uint16Array(bytes(d.uvs).buffer)
  const uv = Float32Array.from(u16, (v) => v / 65535)
  const ib = bytes(d.index).buffer
  const index = d.index32 ? new Uint32Array(ib) : new Uint16Array(ib)
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('normal', new BufferAttribute(nor, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(new BufferAttribute(index, 1))
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return { geometry: g, height: d.min[1] + d.extent[1] }
}

export interface RealModel { geometry: BufferGeometry; texture: Texture | null; height: number }
const cache = new Map<string, Promise<RealModel>>()

export function loadRealistic(buildingId: string): Promise<RealModel> | null {
  const src = SOURCES[buildingId]
  if (!src) return null
  let p = cache.get(buildingId)
  if (!p) {
    p = src().then(({ default: d }) => {
      const { geometry, height } = decode(d)
      let texture: Texture | null = null
      if (d.texture) {
        // chargé comme une image (pas de requête réseau) : compatible avec la version navigateur
        texture = new TextureLoader().load(d.texture)
        texture.flipY = false
        texture.colorSpace = SRGBColorSpace
        texture.anisotropy = 4
      }
      return { geometry, texture, height }
    })
    cache.set(buildingId, p)
  }
  return p
}
