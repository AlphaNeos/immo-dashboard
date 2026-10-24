// Convertit un modèle GLB (Higgsfield / Tripo) en un fichier JSON compact pour la ville :
//   - sol du modèle posé à y = 0, centré, taille ajustée à la parcelle, rotation éventuelle de la façade
//   - géométrie simplifiée puis quantifiée (Int16 / Int8 / Uint16), texture réduite en WebP
// Pourquoi pas le GLB tel quel ? Il pèse plusieurs Mo, et la version navigateur bloque le chargement de fichiers.
// Usage : node scripts/convert-glb.mjs entree.glb sortie.json --size 2.9 --rot 0 --tris 14000 --tex 1024
import { readFileSync, writeFileSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, simplify, prune } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'

const [, , input, output, ...rest] = process.argv
const opt = { size: 2.9, rot: 0, tris: 14000, tex: 1024 }
for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = Number(rest[i + 1])

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
const doc = await io.read(input)
await MeshoptSimplifier.ready
const countTris = () => doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives()).reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)
const before = countTris()
await doc.transform(dedup(), weld())
const ratio = Math.min(1, opt.tris / countTris())
if (ratio < 1) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.002 }))
await doc.transform(prune())

// --- fusion de toutes les primitives, avec leur transformation dans la scène
const P = [], N = [], U = [], I = []
let texImage = null, texMime = null, primitives = 0
const mul = (m, x, y, z, w) => [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w, m[2] * x + m[6] * y + m[10] * z + m[14] * w]
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh()
  if (!mesh) continue
  const M = node.getWorldMatrix()
  for (const prim of mesh.listPrimitives()) {
    primitives++
    const pos = prim.getAttribute('POSITION'), nor = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0')
    const base = P.length / 3
    for (let i = 0; i < pos.getCount(); i++) {
      const p = pos.getElement(i, []); P.push(...mul(M, p[0], p[1], p[2], 1))
      const n = nor ? nor.getElement(i, []) : [0, 1, 0]; const t = mul(M, n[0], n[1], n[2], 0); const l = Math.hypot(...t) || 1; N.push(t[0] / l, t[1] / l, t[2] / l)
      const u = uv ? uv.getElement(i, []) : [0, 0]; U.push(u[0], u[1])
    }
    const idx = prim.getIndices()
    if (idx) for (let i = 0; i < idx.getCount(); i++) I.push(base + idx.getScalar(i))
    else for (let i = 0; i < pos.getCount(); i++) I.push(base + i)
    const tex = prim.getMaterial()?.getBaseColorTexture()
    if (tex && !texImage) { texImage = tex.getImage(); texMime = tex.getMimeType() }
  }
}

// --- normalisation : rotation de la façade, centrage, sol à 0, mise à l'échelle
const a = (opt.rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
for (let i = 0; i < P.length; i += 3) {
  const x = P[i], z = P[i + 2]; P[i] = x * c + z * s; P[i + 2] = -x * s + z * c
  const nx = N[i], nz = N[i + 2]; N[i] = nx * c + nz * s; N[i + 2] = -nx * s + nz * c
}
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], P[i + k]); max[k] = Math.max(max[k], P[i + k]) }
const scale = opt.size / Math.max(max[0] - min[0], max[2] - min[2])
const cx = (min[0] + max[0]) / 2, cz = (min[2] + max[2]) / 2
for (let i = 0; i < P.length; i += 3) { P[i] = (P[i] - cx) * scale; P[i + 1] = (P[i + 1] - min[1]) * scale; P[i + 2] = (P[i + 2] - cz) * scale }
const bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity]
for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { bmin[k] = Math.min(bmin[k], P[i + k]); bmax[k] = Math.max(bmax[k], P[i + k]) }

// --- quantification
const ext = bmax.map((v, k) => v - bmin[k] || 1)
const q16 = new Int16Array(P.length)
for (let i = 0; i < P.length; i++) { const k = i % 3; q16[i] = Math.round(((P[i] - bmin[k]) / ext[k]) * 65535 - 32768) }
const n8 = Int8Array.from(N, (v) => Math.round(Math.max(-1, Math.min(1, v)) * 127))
const uv16 = Uint16Array.from(U, (v) => Math.round(Math.max(0, Math.min(1, v)) * 65535))
const vcount = P.length / 3
const index = vcount < 65536 ? Uint16Array.from(I) : Uint32Array.from(I)
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64')

let texture = null
if (texImage) {
  const webp = await sharp(Buffer.from(texImage)).resize(opt.tex, opt.tex, { fit: 'inside' }).webp({ quality: 82 }).toBuffer()
  texture = `data:image/webp;base64,${webp.toString('base64')}`
}
const out = { version: 1, vertices: vcount, triangles: I.length / 3, min: bmin, extent: ext, positions: b64(q16), normals: b64(n8), uvs: b64(uv16), index: b64(index), index32: !(index instanceof Uint16Array), texture }
writeFileSync(output, JSON.stringify(out))
console.log(JSON.stringify({ input: input.split('/').pop(), primitives, trianglesBefore: Math.round(before), triangles: out.triangles, vertices: vcount, texture: texMime, sizeKB: Math.round(JSON.stringify(out).length / 1024), footprint: [+(bmax[0] - bmin[0]).toFixed(2), +(bmax[2] - bmin[2]).toFixed(2)], height: +(bmax[1] - bmin[1]).toFixed(2) }))
