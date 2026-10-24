import { portfolio, type Property } from '../housing/properties'
import { achievements, levelFor, quests } from './progress'

// Détecte ce qui vient d'être accompli (trophée, objectif, niveau) pour le fêter UNE seule fois.
// Au tout premier lancement, l'état actuel est mémorisé sans célébration.
const KEY = 'neo.game.seen.v1'

export interface GameEvent { kind: 'achievement' | 'quest' | 'level'; title: string; detail: string; buildingId?: string }
interface Seen { achievements: string[]; quests: string[]; financeOpen: string[]; level: number }

function current(list: Property[]): Seen {
  const q = quests(list)
  return {
    achievements: achievements(list).filter((a) => a.unlocked).map((a) => a.id),
    quests: q.filter((x) => x.kind === 'data' && x.done).map((x) => x.id),
    financeOpen: q.filter((x) => x.kind === 'finance').map((x) => x.id),
    level: levelFor(portfolio(list).margin).index
  }
}

function load(): Seen | null {
  try {
    const raw = localStorage.getItem(KEY)
    const s = raw ? (JSON.parse(raw) as Seen) : null
    return s && Array.isArray(s.achievements) && Array.isArray(s.quests) && Array.isArray(s.financeOpen) && typeof s.level === 'number' ? s : null
  } catch { return null }
}
function save(s: Seen) { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* sans importance */ } }

export function checkProgress(list: Property[], prev: Seen | null = load()): GameEvent[] {
  const now = current(list)
  save(now)
  if (!prev) return []
  const ev: GameEvent[] = []
  const ach = achievements(list)
  for (const id of now.achievements) if (!prev.achievements.includes(id)) {
    const a = ach.find((x) => x.id === id)!
    ev.push({ kind: 'achievement', title: `Trophée débloqué : ${a.title}`, detail: a.desc })
  }
  const q = quests(list)
  for (const id of now.quests) if (!prev.quests.includes(id)) {
    ev.push({ kind: 'quest', title: 'Objectif accompli', detail: q.find((x) => x.id === id)!.title })
  }
  for (const id of prev.financeOpen) if (!now.financeOpen.includes(id)) {
    const bid = id.replace(/^q-(15|30)-/, '')
    const p = list.find((x) => x.buildingId === bid)
    if (p) ev.push({ kind: 'quest', title: 'Défi relevé', detail: `${p.address} : seuil de ${id.startsWith('q-15') ? '15' : '30'} % atteint`, buildingId: bid })
  }
  if (now.level > prev.level) {
    ev.push({ kind: 'level', title: `Niveau ${now.level + 1} atteint`, detail: `Vous êtes maintenant ${levelFor(portfolio(list).margin).name}` })
  }
  return ev
}
export type { Seen }
