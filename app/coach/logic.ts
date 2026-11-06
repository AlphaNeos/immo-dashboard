// Logique pure du coach (pas de React ici)

export const WATER_GOAL = 2000
export const OFFICE_GOAL = 240 // min
export const WALK_GOAL = 40 // min
export const PROTEIN_GOAL = 120 // g
export const WEEKLY = { padel: 2, kine: 2, renfo: 1 } as const
export const STORAGE_KEY = 'coach-perso-v2'

export type Supp = { id: string; name: string; time: string } // time = "HH:MM"
export type SleepPlan = {
  startDate: string
  startBed: number // minutes après minuit (180 = 03:00)
  startWake: number // minutes depuis minuit (630 = 10:30)
  targetBed: number
  targetWake: number
  stepMin: number
  everyDays: number
}
export type Settings = {
  heightCm: number
  startWeight: number
  goalWeight: number
  supplements: Supp[]
  sleep: SleepPlan
  weights: Record<string, number>
}
export type Craving = { type: 'sucre' | 'gras' | 'autre' | 'plaisir'; note: string; t: string }
export type Day = {
  water: number
  protein: number
  done: Record<string, boolean>
  officeMin: number
  walkMin: number
  padel: boolean
  kine: boolean
  renfo: boolean
  cravings: Craving[]
  mood: number
  feedback: string
  closed: boolean
}
export type Store = { days: Record<string, Day>; settings: Settings }
export type Task = { id: string; label: string; min: number; emoji: string; points: number; hint?: string }

// ───── Dates ─────
export const ymd = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
export const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return ymd(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000)
export const weekStart = (s: string) => addDays(s, -((new Date(s + 'T12:00:00').getDay() + 6) % 7))
export const weekDays = (s: string) => Array.from({ length: 7 }, (_, i) => addDays(weekStart(s), i))

// ───── Heures ─────
export const fmtClock = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
export const parseClock = (s: string) => {
  const [h, m] = s.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
/** minutes "effectives" : avant 6h du matin = soirée tardive (trié en fin de journée) */
export const eff = (min: number) => (min < 360 ? min + 1440 : min)
export const fmtH = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`

// ───── Defaults / migration ─────
export const emptyDay = (): Day => ({
  water: 0, protein: 0, done: {}, officeMin: 0, walkMin: 0,
  padel: false, kine: false, renfo: false, cravings: [], mood: 0, feedback: '', closed: false,
})

export const defaultSettings = (): Settings => ({
  heightCm: 176,
  startWeight: 102,
  goalWeight: 90,
  supplements: [],
  sleep: {
    startDate: ymd(), startBed: 180, startWake: 630,
    targetBed: 30, targetWake: 480, stepMin: 30, everyDays: 3,
  },
  weights: { [ymd()]: 102 },
})

export function migrate(raw: unknown): Store {
  const r = (raw ?? {}) as Partial<Store>
  const base = defaultSettings()
  const days: Record<string, Day> = {}
  for (const [k, v] of Object.entries(r.days ?? {})) days[k] = { ...emptyDay(), ...v }
  return { days, settings: { ...base, ...(r.settings ?? {}), sleep: { ...base.sleep, ...(r.settings?.sleep ?? {}) } } }
}

// ───── Plan de sommeil progressif ─────
export function sleepFor(date: string, p: SleepPlan) {
  const steps = Math.max(0, Math.floor(daysBetween(p.startDate, date) / p.everyDays))
  const bed = Math.max(p.targetBed, p.startBed - steps * p.stepMin)
  const wake = Math.max(p.targetWake, p.startWake - steps * p.stepMin)
  const done = bed === p.targetBed && wake === p.targetWake
  const nextIn = done ? 0 : p.everyDays - (Math.max(0, daysBetween(p.startDate, date)) % p.everyDays)
  return { bed, wake, done, nextIn }
}

// ───── Programme du jour ─────
export function ankleDue(date: string, store: Store) {
  return !store.days[addDays(date, -1)]?.done['cheville']
}

export function tasksFor(date: string, store: Store): Task[] {
  const { settings: s } = store
  const sl = sleepFor(date, s.sleep)
  const list: Task[] = [
    { id: 'reveil', label: 'Réveil à l’heure du plan', min: sl.wake, emoji: '⏰', points: 15, hint: 'Lever = le plus important pour recaler l’horloge' },
    { id: 'repas1', label: 'Premier repas protéiné', min: sl.wake + 45, emoji: '🍳', points: 10, hint: 'Œufs, skyr/fromage blanc, jambon…' },
    { id: 'repas2', label: 'Repas du midi', min: 13 * 60 + 30, emoji: '🥗', points: 10 },
    { id: 'collation', label: 'Collation prévue (fruit + protéines)', min: 17 * 60, emoji: '🍎', points: 10, hint: 'Évite le craquage de fin d’après-midi' },
    { id: 'repas3', label: 'Dîner', min: 20 * 60, emoji: '🍽️', points: 10 },
    { id: 'soins', label: 'Soins du visage', min: sl.bed - 60, emoji: '🧴', points: 15 },
    { id: 'ecran', label: 'Écrans coupés', min: sl.bed - 45, emoji: '📵', points: 10 },
    { id: 'coucher', label: 'Au lit à l’heure du plan', min: sl.bed, emoji: '😴', points: 20 },
  ]
  for (const sp of s.supplements) {
    list.push({ id: 'supp:' + sp.id, label: sp.name, min: parseClock(sp.time), emoji: '💊', points: 8 })
  }
  if (ankleDue(date, store)) {
    list.push({ id: 'cheville', label: 'Cheville : élastique + montées sur pointes', min: 18 * 60 + 30, emoji: '🦶', points: 10, hint: 'Un jour sur deux' })
  }
  return list.sort((a, b) => eff(a.min) - eff(b.min))
}

// ───── Score ─────
export function dayScore(d: Day, tasks: Task[]) {
  const base = tasks.reduce((a, t) => a + t.points, 0) + 20 + 20 + 15 + 15
  let pts = 0
  for (const t of tasks) if (d.done[t.id]) pts += t.points
  pts += Math.round(Math.min(d.water / WATER_GOAL, 1) * 20)
  pts += Math.round(Math.min(d.officeMin / OFFICE_GOAL, 1) * 20)
  pts += Math.round(Math.min(d.walkMin / WALK_GOAL, 1) * 15)
  pts += Math.round(Math.min(d.protein / PROTEIN_GOAL, 1) * 15)
  if (d.padel) pts += 25
  if (d.kine) pts += 15
  if (d.renfo) pts += 20
  pts -= d.cravings.filter(c => c.type !== 'plaisir').length * 5
  pts = Math.max(0, pts)
  return { pts, pct: Math.min(100, Math.round((pts / base) * 100)) }
}
export const scoreOn = (date: string, store: Store) => {
  const d = store.days[date]
  return d ? dayScore(d, tasksFor(date, store)) : { pts: 0, pct: 0 }
}

export const weekCount = (date: string, store: Store, key: 'padel' | 'kine' | 'renfo') =>
  weekDays(date).filter(k => store.days[k]?.[key]).length

export function currentWeight(store: Store) {
  const ks = Object.keys(store.settings.weights).sort()
  return ks.length ? store.settings.weights[ks[ks.length - 1]] : store.settings.startWeight
}

// ───── Conseils (coach à règles) ─────
export function coachAdvice(date: string, store: Store): string[] {
  const d = store.days[date] ?? emptyDay()
  const { pct } = scoreOn(date, store)
  const out: string[] = []
  const last7 = Array.from({ length: 7 }, (_, i) => store.days[addDays(date, -i)]).filter(Boolean) as Day[]
  const n = (f: (x: Day) => boolean) => last7.filter(f).length
  const sl = sleepFor(date, store.settings.sleep)

  if (pct >= 85) out.push('🔥 Grosse journée. Ne change rien, répète demain.')
  else if (pct >= 60) out.push('👍 Journée solide. Choisis UNE chose à améliorer demain, pas dix.')
  else out.push('💛 Journée plus dure, pas grave. Demain : 3 victoires faciles (eau, repas protéiné, 20 min de marche).')

  if (!d.done['coucher'] || !d.done['reveil']) {
    out.push(`😴 Sommeil : cible du jour lever ${fmtClock(sl.wake)} / coucher ${fmtClock(sl.bed)}. Si c’est trop dur, utilise « Garder cet horaire 3 jours de plus » : mieux vaut lent que d’abandonner.`)
  } else if (!sl.done) {
    out.push(`😴 Bien joué sur le sommeil. Prochain cran dans ${sl.nextIn} jour(s) (−${store.settings.sleep.stepMin} min).`)
  }
  if (d.water < WATER_GOAL * 0.75) {
    out.push(n(x => x.water < 1500) >= 3
      ? '💧 Eau basse plusieurs jours : bouteille de 50 cl visible sur le bureau, une à chaque grand moment (réveil, midi, crèche, dîner).'
      : '💧 Eau en retard : un grand verre au réveil et un avant chaque repas = déjà 1 L.')
  }
  if (d.protein < PROTEIN_GOAL * 0.7) {
    out.push('🥚 Protéines basses : ajoute une source à chaque repas. C’est ce qui te rassasie et limite les craquages sans te priver.')
  }
  if (d.officeMin < OFFICE_GOAL * 0.5) {
    out.push('🏢 Bureau court : bloc 1 à midi (jusqu’à la crèche), bloc 2 après la crèche. Fixe une heure de fin de bloc plutôt qu’une durée.')
  }
  if (d.walkMin < WALK_GOAL) {
    out.push('🚶 Marche : colle-la à un moment fixe (après le déjeuner, trajet crèche à pied). En cas de froid : tapis/pas sur place devant une série comptent.')
  }
  const crav = n(x => x.cravings.some(c => c.type === 'sucre' || c.type === 'gras'))
  if (d.cravings.filter(c => c.type !== 'plaisir').length >= 2 || crav >= 3) {
    out.push('🍫 Craquages répétés : cause fréquente = repas trop léger, manque de sommeil ou stress. Prévois un « plaisir » à l’avance (le noter en « plaisir » ne te pénalise pas).')
  }
  const wk = (k: 'padel' | 'kine' | 'renfo') => weekCount(date, store, k)
  if (wk('padel') < WEEKLY.padel) out.push(`🎾 Padel ${wk('padel')}/${WEEKLY.padel} cette semaine : réserve le créneau maintenant, c’est ce qui fait la différence.`)
  if (wk('kine') < WEEKLY.kine) out.push(`🩺 Kiné ${wk('kine')}/${WEEKLY.kine} cette semaine.`)
  if (wk('renfo') < WEEKLY.renfo) out.push(`🦵 Renfo jambes ${wk('renfo')}/${WEEKLY.renfo} cette semaine (15–20 min suffisent).`)

  const ws = Object.keys(store.settings.weights).sort()
  if (ws.length >= 3) {
    const recent = ws.slice(-3).map(k => store.settings.weights[k])
    if (recent[2] >= recent[0]) out.push('⚖️ Poids stable ces dernières pesées : normal, ça fluctue. Regarde la tendance sur 2–3 semaines avant de changer quoi que ce soit.')
  }
  if (d.mood && d.mood <= 2) out.push('🫶 Moral bas : demain, version réduite — eau, repas, marche, coucher. Le reste est bonus.')
  return out
}

export function reportText(date: string, store: Store) {
  const d = store.days[date] ?? emptyDay()
  const tasks = tasksFor(date, store)
  const { pct } = scoreOn(date, store)
  const sl = sleepFor(date, store.settings.sleep)
  const ok: string[] = []
  const ko: string[] = []
  for (const t of tasks) (d.done[t.id] ? ok : ko).push(`${t.label} (${fmtClock(t.min)})`)
  ;(d.water >= WATER_GOAL ? ok : ko).push(`Eau ${(d.water / 1000).toFixed(2)} L / 2 L`)
  ;(d.protein >= PROTEIN_GOAL ? ok : ko).push(`Protéines ${d.protein} g / ${PROTEIN_GOAL} g`)
  ;(d.officeMin >= OFFICE_GOAL ? ok : ko).push(`Bureau ${fmtH(d.officeMin)} / 4h`)
  ;(d.walkMin >= WALK_GOAL ? ok : ko).push(`Marche ${d.walkMin} / ${WALK_GOAL} min`)
  if (d.padel) ok.push('Padel')
  if (d.kine) ok.push('Kiné')
  if (d.renfo) ok.push('Renfo jambes')
  return [
    `Bilan du ${date} — score ${pct}% — poids actuel ${currentWeight(store)} kg (objectif ${store.settings.goalWeight})`,
    `Plan sommeil du jour : lever ${fmtClock(sl.wake)}, coucher ${fmtClock(sl.bed)}`,
    '', '✅ Fait :', ...(ok.length ? ok.map(x => `- ${x}`) : ['- rien']),
    '', '❌ Pas fait :', ...(ko.length ? ko.map(x => `- ${x}`) : ['- rien']),
    '',
    `Craquages : ${d.cravings.length ? d.cravings.map(c => `${c.type}${c.note ? ` (${c.note})` : ''}`).join(', ') : 'aucun'}`,
    `Cette semaine : padel ${weekCount(date, store, 'padel')}/2, kiné ${weekCount(date, store, 'kine')}/2, renfo ${weekCount(date, store, 'renfo')}/1`,
    `Moral : ${d.mood || 'non noté'}/5`,
    `Mon retour : ${d.feedback || '—'}`,
    '', 'Aide-moi à adapter mon programme pour demain.',
  ].join('\n')
}
