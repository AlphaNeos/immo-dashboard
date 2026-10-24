// Mécaniques de jeu, toutes calculées à partir des VRAIES fiches (aucune donnée inventée).
import { finance, portfolio, type Property } from '../housing/properties'

// ---------------------------------------------------------------- Niveaux
// Le niveau dépend de la marge brute mensuelle totale du portefeuille.
export const LEVELS = [
  { min: 0, name: 'Débutant' },
  { min: 2500, name: 'Gestionnaire' },
  { min: 5000, name: 'Bâtisseur' },
  { min: 7500, name: 'Investisseur' },
  { min: 10000, name: 'Promoteur' },
  { min: 15000, name: 'Magnat' },
  { min: 25000, name: 'Tycoon' }
] as const

export interface Level {
  index: number // 0-based
  name: string
  min: number
  next: { name: string; min: number } | null
  progress: number // 0..1 vers le niveau suivant
  missing: number // € de marge mensuelle manquants pour le niveau suivant
}

export function levelFor(margin: number): Level {
  let i = 0
  while (i < LEVELS.length - 1 && margin >= LEVELS[i + 1].min) i++
  const cur = LEVELS[i]
  const next = LEVELS[i + 1] ?? null
  const progress = next ? Math.max(0, Math.min(1, (margin - cur.min) / (next.min - cur.min))) : 1
  const missing = next ? Math.round((next.min - margin) * 100) / 100 : 0
  return { index: i, name: cur.name, min: cur.min, next, progress, missing }
}

// ---------------------------------------------------------------- Compteur du mois
// Marge « générée » depuis le début du mois, au prorata du temps écoulé. C'est une ESTIMATION, pas un encaissement.
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
export function monthAccrual(monthlyMargin: number, now: Date) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const fraction = (now.getTime() - start) / (end - start)
  const daysInMonth = Math.round((end - start) / 86400000)
  return {
    amount: monthlyMargin * fraction,
    fraction,
    day: now.getDate(),
    daysInMonth,
    monthName: MONTHS[now.getMonth()],
    perSecond: monthlyMargin / ((end - start) / 1000)
  }
}

// ---------------------------------------------------------------- Que faut-il pour atteindre un taux de marge ?
export function requiredFor(p: Property, targetRate: number) {
  const f = finance(p)
  const billedNeeded = Math.ceil((f.cost / (1 - targetRate)) * 100) / 100
  const costMax = Math.floor(f.billed * (1 - targetRate) * 100) / 100
  return {
    reached: f.rate >= targetRate,
    billedNeeded,
    billedDelta: Math.max(0, Math.round((billedNeeded - f.billed) * 100) / 100),
    costMax,
    costDelta: Math.max(0, Math.round((f.cost - costMax) * 100) / 100)
  }
}

// ---------------------------------------------------------------- Trophées
export interface Achievement {
  id: string
  title: string
  desc: string
  unlocked: boolean
  progress?: [number, number]
}

const isBlock = (p: Property) => !!p.studios?.length

export function achievements(list: Property[]): Achievement[] {
  const t = portfolio(list)
  const rates = list.map((p) => finance(p).rate)
  const houses = list.filter((p) => !isBlock(p))
  const count = (pred: (p: Property) => boolean, l = list): [number, number] => [l.filter(pred).length, l.length]
  const studios = list.flatMap((p) => p.studios ?? [])
  const a = (id: string, title: string, desc: string, progress: [number, number]): Achievement => ({
    id, title, desc, progress, unlocked: progress[0] >= progress[1]
  })
  return [
    a('first', 'Premier pas', 'Gérer un premier logement', [Math.min(list.length, 1), 1]),
    a('six', 'Six clés en main', 'Gérer 6 logements', [Math.min(list.length, 6), 6]),
    a('block', 'Immeuble de rapport', 'Gérer un immeuble à plusieurs logements', [Math.min(list.filter(isBlock).length, 1), 1]),
    a('elite', "Marge d'élite", 'Un logement à 50 % de marge ou plus', [Math.min(rates.filter((r) => r >= 0.5).length, 1), 1]),
    a('10k', 'Cap des 10 000 €', '10 000 € de marge brute par mois', [Math.min(Math.floor(t.margin), 10000), 10000]),
    a('100k', 'Six chiffres', '100 000 € de marge brute par an', [Math.min(Math.floor(t.yearlyMargin), 100000), 100000]),
    a('noweak', 'Sans maillon faible', 'Tous les logements à 15 % de marge ou plus', count((p) => finance(p).rate >= 0.15)),
    a('owners', "Carnet d'adresses", 'Renseigner le propriétaire de chaque logement', count((p) => !!p.owner)),
    a('clients', 'Clients identifiés', "Renseigner l'entreprise cliente de chaque logement", count((p) => !!p.clientCompany)),
    a('rooms', 'Recensement', 'Renseigner le nombre de chambres de chaque maison et appartement', count((p) => p.bedrooms != null, houses)),
    a('studios', 'Immeuble au complet', "Renseigner l'occupant de chaque studio", [studios.filter((s) => !!s.occupant).length, studios.length]),
    a('magnat', 'Magnat', '15 000 € de marge brute par mois', [Math.min(Math.floor(t.margin), 15000), 15000])
  ]
}

// ---------------------------------------------------------------- Objectifs (quêtes)
export interface Quest {
  id: string
  kind: 'data' | 'finance' | 'level'
  title: string
  detail: string
  done: boolean
  progress?: [number, number]
  targets: string[] // bâtiments concernés, dans l'ordre où les traiter
}

const eur = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' })

export function quests(list: Property[]): Quest[] {
  const out: Quest[] = []
  const missing = (pred: (p: Property) => boolean, l = list) => l.filter((p) => !pred(p)).map((p) => p.buildingId)
  const dataQuest = (id: string, title: string, detail: string, pred: (p: Property) => boolean, l = list) => {
    const todo = missing(pred, l)
    out.push({ id, kind: 'data', title, detail, done: todo.length === 0, progress: [l.length - todo.length, l.length], targets: todo })
  }
  dataQuest('q-owners', 'Renseigner les propriétaires', 'Ouvrez la fiche, bouton « Modifier », champ Propriétaire.', (p) => !!p.owner)
  dataQuest('q-clients', 'Renseigner les entreprises clientes', 'Ouvrez la fiche, bouton « Modifier », champ Entreprise cliente.', (p) => !!p.clientCompany)
  dataQuest('q-rooms', 'Compter les chambres', 'Nombre de chambres des maisons et appartements.', (p) => p.bedrooms != null, list.filter((p) => !isBlock(p)))
  for (const p of list.filter(isBlock)) {
    const s = p.studios!
    const todo = s.filter((x) => !x.occupant).length
    out.push({
      id: `q-studios-${p.buildingId}`, kind: 'data', title: `Occupants de l'${p.name.toLowerCase()}`,
      detail: `${p.address} : renseigner l'occupant de chaque studio.`, done: todo === 0,
      progress: [s.length - todo, s.length], targets: todo ? [p.buildingId] : []
    })
  }
  // défis financiers : rien n'est modifié automatiquement, on montre seulement le chemin
  for (const p of list) {
    const r15 = requiredFor(p, 0.15)
    const r30 = requiredFor(p, 0.3)
    if (!r15.reached) {
      out.push({
        id: `q-15-${p.buildingId}`, kind: 'finance', title: `${p.address} : passer au-dessus de 15 %`,
        detail: `Facturer ${eur.format(r15.billedNeeded)} (+${eur.format(r15.billedDelta)}) ou réduire les coûts de ${eur.format(r15.costDelta)}.`,
        done: false, targets: [p.buildingId]
      })
    } else if (!r30.reached) {
      out.push({
        id: `q-30-${p.buildingId}`, kind: 'finance', title: `${p.address} : viser 30 %`,
        detail: `Facturer ${eur.format(r30.billedNeeded)} (+${eur.format(r30.billedDelta)}) ou réduire les coûts de ${eur.format(r30.costDelta)}.`,
        done: false, targets: [p.buildingId]
      })
    }
  }
  const lvl = levelFor(portfolio(list).margin)
  if (lvl.next) {
    out.push({
      id: `q-level-${lvl.next.name}`, kind: 'level', title: `Devenir ${lvl.next.name}`,
      detail: `Encore ${eur.format(lvl.missing)} de marge brute mensuelle.`, done: false, targets: []
    })
  }
  return out
}

// ---------------------------------------------------------------- Classement
export function ranking(list: Property[], by: 'margin' | 'rate' = 'margin') {
  return list
    .map((p) => ({ p, f: finance(p) }))
    .sort((a, b) => (by === 'margin' ? b.f.margin - a.f.margin : b.f.rate - a.f.rate))
}
