import { useMemo } from 'react'
import { Batch } from './Batch'
import { Buildings } from '../housing/Buildings'
import { Gallery } from '../housing/Gallery'
import { INITIAL_BUILDINGS } from '../housing/buildings'
import { Life } from '../life/Life'
import { lampKey, patchLamp, windPine, windPineKey, windRound, windRoundKey } from '../life/shaders'
import { BLOCK, HALF, POND, ROADS_X, ROADS_Z, ROAD_W, SIDEWALK_TOP, buildCity, type Item } from './layout'

const ASPHALT = '#4a4f59'
const SIDEWALK = '#d8d2c4'

function Terrain({ patches }: { patches: Item[] }) {
  return (
    <group>
      {/* dalle d'herbe + socle de terre : effet « miniature » */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[HALF * 2 + 0.2, 0.3, HALF * 2 + 0.2]} />
        <meshStandardMaterial color="#7bc65a" roughness={1} />
      </mesh>
      <mesh position={[0, -1.0, 0]}>
        <boxGeometry args={[HALF * 2, 1.4, HALF * 2]} />
        <meshStandardMaterial color="#8a6a4a" roughness={1} />
      </mesh>
      <Batch items={patches} receive>
        <cylinderGeometry args={[1, 1, 0.01, 16]} />
        <meshStandardMaterial roughness={1} />
      </Batch>
      {/* étang */}
      <mesh position={[POND.x, 0.015, POND.z]} receiveShadow>
        <cylinderGeometry args={[POND.r + 0.35, POND.r + 0.35, 0.03, 32]} />
        <meshStandardMaterial color="#dccd9f" roughness={1} />
      </mesh>
      <mesh position={[POND.x, 0.035, POND.z]} receiveShadow>
        <cylinderGeometry args={[POND.r, POND.r, 0.03, 32]} />
        <meshStandardMaterial color="#5db7d8" roughness={0.25} metalness={0.1} />
      </mesh>
    </group>
  )
}

function Roads({ dashes, crosswalks }: { dashes: Item[]; crosswalks: Item[] }) {
  const len = HALF * 2
  return (
    <group>
      {ROADS_X.map((x) => (
        <mesh key={`rx${x}`} position={[x, 0.02, 0]} receiveShadow>
          <boxGeometry args={[ROAD_W, 0.04, len]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.95} />
        </mesh>
      ))}
      {ROADS_Z.map((z) => (
        <mesh key={`rz${z}`} position={[0, 0.0225, z]} receiveShadow>
          <boxGeometry args={[len, 0.045, ROAD_W]} />
          <meshStandardMaterial color={ASPHALT} roughness={0.95} />
        </mesh>
      ))}
      <Batch items={dashes} receive>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </Batch>
      <Batch items={crosswalks} receive>
        <boxGeometry />
        <meshStandardMaterial roughness={0.8} />
      </Batch>
    </group>
  )
}

function Urban({ data }: { data: ReturnType<typeof buildCity> }) {
  const blocks = useMemo<Item[]>(
    () => data.urban.map((b) => ({ p: [(b.x0 + b.x1) / 2, SIDEWALK_TOP / 2, (b.z0 + b.z1) / 2], s: [BLOCK, SIDEWALK_TOP, BLOCK] })),
    [data]
  )
  const fountain = data.plots.find((p) => p.kind === 'fountain')
  return (
    <group>
      <Batch items={blocks} cast receive>
        <boxGeometry />
        <meshStandardMaterial color={SIDEWALK} roughness={0.9} />
      </Batch>
      <Batch items={data.strips} receive>
        <boxGeometry />
        <meshStandardMaterial color={SIDEWALK} roughness={0.9} />
      </Batch>
      <Batch items={data.pads} receive>
        <boxGeometry />
        <meshStandardMaterial roughness={0.95} />
      </Batch>
      <Batch items={data.borders} receive>
        <boxGeometry />
        <meshStandardMaterial roughness={0.7} />
      </Batch>
      {fountain && (
        <group position={[fountain.x, fountain.top, fountain.z]} scale={1.8}>
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.75, 0.8, 0.18, 24]} />
            <meshStandardMaterial color="#c9c3b5" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.66, 0.66, 0.03, 24]} />
            <meshStandardMaterial color="#5db7d8" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.4, 10]} />
            <meshStandardMaterial color="#c9c3b5" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.58, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.12, 0.07, 18]} />
            <meshStandardMaterial color="#c9c3b5" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.02, 18]} />
            <meshStandardMaterial color="#5db7d8" roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Props({ data }: { data: ReturnType<typeof buildCity> }) {
  const parts = useMemo(() => {
    const trunks: Item[] = []
    const blobs: Item[] = []
    const blobs2: Item[] = []
    const cones1: Item[] = []
    const cones2: Item[] = []
    const cones3: Item[] = []
    for (const t of data.trees) {
      const { x, z, base: b, s, c } = t
      if (t.kind === 'round') {
        trunks.push({ p: [x, b + 0.3 * s, z], s, c: '#8b5a2b' })
        blobs.push({ p: [x, b + 0.95 * s, z], s: [s, s * 0.9, s], c })
        blobs2.push({ p: [x + 0.18 * s, b + 1.3 * s, z - 0.1 * s], s: s * 0.65, c })
      } else {
        trunks.push({ p: [x, b + 0.18 * s, z], s: [s, s * 0.6, s], c: '#7a4e25' })
        cones1.push({ p: [x, b + 0.7 * s, z], s, c })
        cones2.push({ p: [x, b + 1.05 * s, z], s: s * 0.75, c })
        cones3.push({ p: [x, b + 1.3 * s, z], s: s * 0.5, c })
      }
    }
    return { trunks, blobs, blobs2, cones1, cones2, cones3 }
  }, [data])

  const lampPoles = useMemo<Item[]>(() => data.lamps.map((l) => ({ p: [l.p[0], l.p[1] + 0.65, l.p[2]] })), [data])
  const lampHeads = useMemo<Item[]>(() => data.lamps.map((l) => ({ p: [l.p[0], l.p[1] + 1.36, l.p[2]] })), [data])
  const benchSeats = useMemo<Item[]>(() => data.benches.map((b) => ({ p: [b.p[0], b.p[1] + 0.25, b.p[2]], ry: b.ry, s: [0.9, 0.07, 0.3] })), [data])
  const benchBacks = useMemo<Item[]>(() => data.benches.map((b) => ({ p: [b.p[0], b.p[1] + 0.42, b.p[2] + 0.13], ry: b.ry, s: [0.9, 0.3, 0.05] })), [data])
  const benchLegs = useMemo<Item[]>(
    () => data.benches.flatMap((b) => [-0.38, 0.38].map((dx) => ({ p: [b.p[0] + dx, b.p[1] + 0.11, b.p[2]] as [number, number, number], s: [0.07, 0.22, 0.26] as [number, number, number] }))),
    [data]
  )

  return (
    <group>
      <Batch items={parts.trunks} cast>
        <cylinderGeometry args={[0.07, 0.09, 0.6, 6]} />
        <meshStandardMaterial roughness={1} />
      </Batch>
      <Batch items={parts.blobs} cast>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading onBeforeCompile={windRound} customProgramCacheKey={windRoundKey} />
      </Batch>
      <Batch items={parts.blobs2} cast>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading onBeforeCompile={windRound} customProgramCacheKey={windRoundKey} />
      </Batch>
      {[parts.cones1, parts.cones2, parts.cones3].map((items, i) => (
        <Batch key={i} items={items} cast>
          <coneGeometry args={[0.5, 0.8, 7]} />
          <meshStandardMaterial roughness={0.9} flatShading onBeforeCompile={windPine} customProgramCacheKey={windPineKey} />
        </Batch>
      ))}
      <Batch items={data.bushes} cast>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </Batch>
      <Batch items={data.flowers}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </Batch>
      <Batch items={data.rocks} cast receive>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </Batch>
      <Batch items={lampPoles} cast>
        <cylinderGeometry args={[0.03, 0.045, 1.3, 6]} />
        <meshStandardMaterial color="#3b4252" roughness={0.6} metalness={0.3} />
      </Batch>
      <Batch items={lampHeads}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#fff3d0" emissive="#ffd98a" emissiveIntensity={1.0} onBeforeCompile={patchLamp} customProgramCacheKey={lampKey} />
      </Batch>
      <Batch items={benchSeats} cast>
        <boxGeometry />
        <meshStandardMaterial color="#b9824a" roughness={0.8} />
      </Batch>
      <Batch items={benchBacks} cast>
        <boxGeometry />
        <meshStandardMaterial color="#b9824a" roughness={0.8} />
      </Batch>
      <Batch items={benchLegs} cast>
        <boxGeometry />
        <meshStandardMaterial color="#3b4252" roughness={0.6} />
      </Batch>
    </group>
  )
}

const OCCUPIED = INITIAL_BUILDINGS.map((b) => b.plotId)

export function CityWorld({ gallery = false }: { gallery?: boolean }) {
  const data = useMemo(() => buildCity(OCCUPIED), [])
  if (gallery) return <Gallery />
  return (
    <group>
      <Terrain patches={data.patches} />
      <Roads dashes={data.dashes} crosswalks={data.crosswalks} />
      <Urban data={data} />
      <Props data={data} />
      <Buildings plots={data.plots} />
      <Life data={data} />
    </group>
  )
}
