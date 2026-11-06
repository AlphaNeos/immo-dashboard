'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// ───────────────────────── Config ─────────────────────────
const WATER_GOAL = 2000
const OFFICE_GOAL = 240 // min
const WALK_GOAL = 30 // min
const PADEL_GOAL = 2 // par semaine
const STORAGE_KEY = 'coach-perso-v1'

type Task = { id: string; label: string; time: string; emoji: string; points: number; group: 'matin' | 'journee' | 'soir' }

const TASKS: Task[] = [
  { id: 'reveil', label: 'Réveil à heure régulière', time: '08:00', emoji: '⏰', points: 10, group: 'matin' },
  { id: 'comp_matin', label: 'Compléments du matin', time: '08:30', emoji: '💊', points: 10, group: 'matin' },
  { id: 'comp_midi', label: 'Compléments du midi', time: '12:30', emoji: '💊', points: 10, group: 'journee' },
  { id: 'repas', label: 'Repas équilibrés (sans craquage)', time: '13:00', emoji: '🥗', points: 15, group: 'journee' },
  { id: 'soins', label: 'Soins du visage', time: '21:30', emoji: '🧴', points: 15, group: 'soir' },
  { id: 'comp_soir', label: 'Compléments du soir', time: '21:45', emoji: '💊', points: 10, group: 'soir' },
  { id: 'ecran', label: 'Écrans coupés avant de dormir', time: '22:30', emoji: '📵', points: 10, group: 'soir' },
  { id: 'coucher', label: 'Au lit à l’heure (≈ 23:00)', time: '23:00', emoji: '😴', points: 15, group: 'soir' },
]

type Craving = { type: 'sucre' | 'gras' | 'autre'; note: string; t: string }
type Day = {
  water: number
  done: Record<string, boolean>
  officeMin: number
  walkMin: number
  padel: boolean
  cravings: Craving[]
  mood: number // 1-5, 0 = non renseigné
  feedback: string
  closed: boolean
}
type Store = { days: Record<string, Day> }

const emptyDay = (): Day => ({ water: 0, done: {}, officeMin: 0, walkMin: 0, padel: false, cravings: [], mood: 0, feedback: '', closed: false })

// ───────────────────────── Helpers ─────────────────────────
const ymd = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return z.toISOString().slice(0, 10)
}
const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return ymd(d)
}
const weekStart = (s: string) => {
  const d = new Date(s + 'T12:00:00')
  const wd = (d.getDay() + 6) % 7 // lundi = 0
  return addDays(s, -wd)
}
const fmtH = (min: number) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`

function dayScore(d: Day) {
  const max = TASKS.reduce((a, t) => a + t.points, 0) + 20 + 20 + 15
  let pts = 0
  for (const t of TASKS) if (d.done[t.id]) pts += t.points
  pts += Math.round(Math.min(d.water / WATER_GOAL, 1) * 20)
  pts += Math.round(Math.min(d.officeMin / OFFICE_GOAL, 1) * 20)
  pts += Math.round(Math.min(d.walkMin / WALK_GOAL, 1) * 15)
  pts += d.padel ? 25 : 0
  pts -= d.cravings.length * 5
  return { pts: Math.max(pts, 0), pct: Math.max(0, Math.min(100, Math.round((Math.max(pts, 0) / max) * 100))) }
}

function useStore() {
  const [store, setStore] = useState<Store | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStore(raw ? JSON.parse(raw) : { days: {} })
    } catch {
       
      setStore({ days: {} })
    }
  }, [])
  useEffect(() => {
    if (!store) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
  }, [store])
  return [store, setStore] as const
}

// ───────────────────────── Coach (règles) ─────────────────────────
function buildReport(date: string, store: Store) {
  const d = store.days[date] ?? emptyDay()
  const { pct } = dayScore(d)
  const ok: string[] = []
  const ko: string[] = []
  for (const t of TASKS) (d.done[t.id] ? ok : ko).push(t.label)
  ;(d.water >= WATER_GOAL ? ok : ko).push(`Eau ${(d.water / 1000).toFixed(2)} L / 2 L`)
  ;(d.officeMin >= OFFICE_GOAL ? ok : ko).push(`Bureau ${fmtH(d.officeMin)} / 4h`)
  ;(d.walkMin >= WALK_GOAL ? ok : ko).push(`Marche ${d.walkMin} min / ${WALK_GOAL}`)
  if (d.padel) ok.push('Padel fait')
  return { d, pct, ok, ko }
}

function coachAdvice(date: string, store: Store): string[] {
  const { d, pct } = buildReport(date, store)
  const out: string[] = []
  const last7 = Array.from({ length: 7 }, (_, i) => store.days[addDays(date, -i)]).filter(Boolean) as Day[]
  const count = (f: (x: Day) => boolean) => last7.filter(f).length

  if (pct >= 85) out.push('🔥 Grosse journée. Ne change rien, répète demain.')
  else if (pct >= 60) out.push('👍 Journée solide. Choisis UNE chose à améliorer demain, pas dix.')
  else out.push('💛 Journée plus dure : pas grave. Demain on vise juste 3 victoires faciles (eau, compléments, 20 min de marche).')

  if (d.water < WATER_GOAL * 0.75) {
    out.push(count(x => x.water < 1500) >= 3
      ? '💧 Eau insuffisante plusieurs jours de suite : mets une bouteille de 50 cl sur ton bureau et vide-en 1 à chaque heure ronde (4 le matin, 4 l’après-midi).'
      : '💧 Eau en retard : un grand verre au réveil + un avant chaque repas te fait déjà 1 L.')
  }
  if (d.officeMin < OFFICE_GOAL * 0.5) {
    out.push('🏢 Bureau court : essaie 2 blocs de 2h (9h-11h / 14h-16h) plutôt que d’attendre l’envie. Si pas de boulot urgent, 1h30 compte quand même.')
  }
  if (d.walkMin < WALK_GOAL) {
    out.push('🚶 Marche : accroche-la à un moment fixe (10 min après le déjeuner + 10 min avant le dîner). Plus facile que « quand j’ai le temps ».')
  }
  const sugar = count(x => x.cravings.some(c => c.type === 'sucre'))
  const fat = count(x => x.cravings.some(c => c.type === 'gras'))
  if (d.cravings.length >= 2 || sugar >= 3) {
    out.push('🍫 Craquages sucre fréquents : vérifie 3 choses — assez mangé de protéines au repas ? assez dormi ? stress ? Garde un en-cas prévu (fruit + amandes) pour 16h.')
  } else if (fat >= 3) {
    out.push('🍟 Gras récurrent : souvent un repas trop léger avant. Ajoute féculents + protéines au dîner, et décide du « plaisir » à l’avance (1 fois, planifié).')
  }
  if (!d.done['coucher'] || !d.done['ecran']) {
    out.push('😴 Sommeil : avance le coucher de 15 min chaque soir (pas d’un coup). Écran coupé = point facile à gagner.')
  }
  const padelWeek = Array.from({ length: 7 }, (_, i) => store.days[addDays(weekStart(date), i)]).filter(x => x?.padel).length
  if (padelWeek < PADEL_GOAL) {
    const left = Math.max(0, 6 - ((new Date(date + 'T12:00:00').getDay() + 6) % 7))
    out.push(`🎾 Padel : ${padelWeek}/${PADEL_GOAL} cette semaine, il reste ${left} jour(s). Réserve le créneau maintenant, c’est ce qui fait la différence.`)
  }
  if (d.mood && d.mood <= 2) out.push('🫶 Moral bas aujourd’hui : coupe la liste en deux demain, garde eau + marche + compléments.')
  return out
}

function reportText(date: string, store: Store) {
  const { d, pct, ok, ko } = buildReport(date, store)
  return [
    `Bilan du ${date} — score ${pct}%`,
    '',
    '✅ Fait :', ...(ok.length ? ok.map(x => `- ${x}`) : ['- rien']),
    '',
    '❌ Pas fait :', ...(ko.length ? ko.map(x => `- ${x}`) : ['- rien']),
    '',
    `Craquages : ${d.cravings.length ? d.cravings.map(c => `${c.type}${c.note ? ` (${c.note})` : ''}`).join(', ') : 'aucun'}`,
    `Moral : ${d.mood || 'non noté'}/5`,
    `Mon retour : ${d.feedback || '—'}`,
    '',
    'Aide-moi à adapter mon programme pour demain.',
  ].join('\n')
}

// ───────────────────────── UI bits ─────────────────────────
function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}
function Bar({ pct, color = 'var(--violet)' }: { pct: number; color?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface)]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}
const btn = 'rounded-xl bg-[var(--surface)] px-3 py-2 text-sm font-semibold border border-[var(--border)] active:scale-95 hover:border-[var(--violet)] transition'

// ───────────────────────── Page ─────────────────────────
export default function CoachPage() {
  const [store, setStore] = useStore()
  const [date, setDate] = useState(() => ymd())
  const [now, setNow] = useState(() => new Date())
  const [cNote, setCNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [notif, setNotif] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const isToday = date === ymd(now)
  const day = store?.days[date] ?? emptyDay()

  const update = useCallback((fn: (d: Day) => Day) => {
    setStore(s => (s ? { days: { ...s.days, [date]: fn(s.days[date] ?? emptyDay()) } } : s))
  }, [date, setStore])

  // Rappels : notification navigateur quand l'heure d'une tâche arrive (page ouverte)
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  useEffect(() => {
    if (!store || !isToday || notif !== 'granted') return
    for (const t of TASKS) {
      if (t.time === hhmm && !store.days[date]?.done[t.id]) {
        try { new Notification(`${t.emoji} ${t.label}`, { tag: t.id }) } catch { /* ignore */ }
      }
    }
    if (hhmm === '21:00') { try { new Notification('📋 Bilan du soir : ouvre ton coach', { tag: 'bilan' }) } catch { /* ignore */ } }
  }, [hhmm]) // eslint-disable-line react-hooks/exhaustive-deps

  const { pts, pct } = dayScore(day)
  const totalXp = useMemo(() => Object.values(store?.days ?? {}).reduce((a, d) => a + dayScore(d).pts, 0), [store])
  const level = Math.floor(totalXp / 250) + 1
  const levelPct = ((totalXp % 250) / 250) * 100
  const streak = useMemo(() => {
    if (!store) return 0
    let n = 0
    let cur = ymd(now)
    if (!store.days[cur] || dayScore(store.days[cur]).pct < 60) cur = addDays(cur, -1) // aujourd'hui pas encore fini
    while (store.days[cur] && dayScore(store.days[cur]).pct >= 60) { n++; cur = addDays(cur, -1) }
    return n
  }, [store, now])
  const padelWeek = useMemo(() => {
    if (!store) return 0
    return Array.from({ length: 7 }, (_, i) => store.days[addDays(weekStart(date), i)]).filter(d => d?.padel).length
  }, [store, date])
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const k = addDays(date, i - 6)
    return { k, pct: store?.days[k] ? dayScore(store.days[k]).pct : 0 }
  }), [store, date])

  const nextTask = isToday ? TASKS.find(t => t.time >= hhmm && !day.done[t.id]) : undefined
  const overdue = isToday ? TASKS.filter(t => t.time < hhmm && !day.done[t.id]) : []

  if (!store) return <main className="p-6 text-[var(--muted)]">Chargement…</main>

  const advice = day.closed ? coachAdvice(date, store) : []
  const waterPct = (day.water / WATER_GOAL) * 100

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4 pb-24">
      {/* En-tête */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon Coach 🎯</h1>
            <p className="text-xs text-[var(--muted)]">
              {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {isToday && ` · ${hhmm}`}
            </p>
          </div>
          <div className="flex gap-1">
            <button className={btn} onClick={() => setDate(addDays(date, -1))}>←</button>
            <button className={btn} onClick={() => setDate(ymd())}>Auj.</button>
            <button className={btn} onClick={() => setDate(addDays(date, 1))} disabled={isToday}>→</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">🔥 {streak}</div><div className="text-[11px] text-[var(--muted)]">jours d’affilée</div></div>
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">Niv. {level}</div><div className="mt-1"><Bar pct={levelPct} color="var(--gold)" /></div></div>
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">{pct}%</div><div className="text-[11px] text-[var(--muted)]">{pts} pts aujourd’hui</div></div>
        </div>
        <Bar pct={pct} color={pct >= 85 ? 'var(--green)' : pct >= 60 ? 'var(--violet)' : 'var(--amber)'} />
      </header>

      {/* Rappel en cours */}
      {isToday && (overdue.length > 0 || nextTask) && (
        <div className="rounded-2xl border border-[var(--violet)] bg-[var(--violet-dim)] p-3 text-sm">
          {overdue.length > 0 && <div>⏳ En retard : {overdue.map(t => t.emoji + ' ' + t.label).join(' · ')}</div>}
          {nextTask && <div className="text-[var(--muted)]">Prochain : {nextTask.emoji} {nextTask.label} à {nextTask.time}</div>}
        </div>
      )}
      {notif === 'default' && (
        <button className={btn + ' w-full'} onClick={async () => setNotif(await Notification.requestPermission())}>
          🔔 Activer les rappels (garde cet onglet ouvert)
        </button>
      )}

      {/* Eau */}
      <Card title="💧 Eau — objectif 2 L" right={<span className="text-sm font-bold">{(day.water / 1000).toFixed(2)} L</span>}>
        <Bar pct={waterPct} color="#38BDF8" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[250, 500, 750].map(ml => (
            <button key={ml} className={btn} onClick={() => update(d => ({ ...d, water: d.water + ml }))}>+{ml} ml</button>
          ))}
          <button className={btn} onClick={() => update(d => ({ ...d, water: Math.max(0, d.water - 250) }))}>−250</button>
        </div>
        {day.water >= WATER_GOAL && <p className="mt-2 text-sm text-[var(--green)]">✅ Objectif eau atteint !</p>}
      </Card>

      {/* Tâches */}
      {(['matin', 'journee', 'soir'] as const).map(g => (
        <Card key={g} title={g === 'matin' ? '🌅 Matin' : g === 'journee' ? '☀️ Journée' : '🌙 Soir'}>
          <ul className="space-y-2">
            {TASKS.filter(t => t.group === g).map(t => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--violet)]" checked={!!day.done[t.id]}
                    onChange={e => update(d => ({ ...d, done: { ...d.done, [t.id]: e.target.checked } }))} />
                  <span className={day.done[t.id] ? 'flex-1 line-through opacity-50' : 'flex-1'}>{t.emoji} {t.label}</span>
                  <span className="text-xs text-[var(--muted)]">{t.time} · +{t.points}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {/* Bureau */}
      <Card title="🏢 Bureau — objectif 4h" right={<span className="text-sm font-bold">{fmtH(day.officeMin)}</span>}>
        <Bar pct={(day.officeMin / OFFICE_GOAL) * 100} color="var(--gold)" />
        <div className="mt-3 flex gap-2">
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: d.officeMin + 30 }))}>+30 min</button>
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: d.officeMin + 60 }))}>+1h</button>
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: Math.max(0, d.officeMin - 30) }))}>−30</button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Pas de boulot ? Laisse à 0, ça ne te pénalise pas autant que ça te motive quand il y en a.</p>
      </Card>

      {/* Sport */}
      <Card title="🚶 Marche & 🎾 Padel" right={<span className="text-sm font-bold">Padel {padelWeek}/{PADEL_GOAL} cette semaine</span>}>
        <div className="mb-1 flex justify-between text-sm"><span>Marche</span><b>{day.walkMin} / {WALK_GOAL} min</b></div>
        <Bar pct={(day.walkMin / WALK_GOAL) * 100} color="var(--green)" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 20, 30].map(m => <button key={m} className={btn} onClick={() => update(d => ({ ...d, walkMin: d.walkMin + m }))}>+{m} min</button>)}
          <button className={btn} onClick={() => update(d => ({ ...d, walkMin: Math.max(0, d.walkMin - 10) }))}>−10</button>
        </div>
        <label className="mt-3 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
          <input type="checkbox" className="h-5 w-5 accent-[var(--violet)]" checked={day.padel} onChange={e => update(d => ({ ...d, padel: e.target.checked }))} />
          <span>🎾 J’ai joué au padel (+25)</span>
        </label>
      </Card>

      {/* Craquages */}
      <Card title="🍫 Craquages (sans jugement)" right={<span className="text-xs text-[var(--muted)]">−5 pts chacun</span>}>
        <div className="flex gap-2">
          <input value={cNote} onChange={e => setCNote(e.target.value)} placeholder="Quoi / quand ? (optionnel)"
            className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none" />
        </div>
        <div className="mt-2 flex gap-2">
          {(['sucre', 'gras', 'autre'] as const).map(type => (
            <button key={type} className={btn} onClick={() => { update(d => ({ ...d, cravings: [...d.cravings, { type, note: cNote, t: hhmm }] })); setCNote('') }}>
              + {type}
            </button>
          ))}
        </div>
        {day.cravings.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {day.cravings.map((c, i) => (
              <li key={i} className="flex justify-between rounded-lg bg-[var(--surface)] px-3 py-2">
                <span>{c.t} · {c.type}{c.note && ` — ${c.note}`}</span>
                <button className="text-[var(--muted)]" onClick={() => update(d => ({ ...d, cravings: d.cravings.filter((_, j) => j !== i) }))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Semaine */}
      <Card title="📈 7 derniers jours">
        <div className="flex h-24 items-end gap-2">
          {last7.map(x => (
            <button key={x.k} onClick={() => setDate(x.k)} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end rounded bg-[var(--surface)]">
                <div className="w-full rounded" style={{ height: `${x.pct}%`, background: x.pct >= 60 ? 'var(--green)' : 'var(--amber)' }} />
              </div>
              <span className={`text-[10px] ${x.k === date ? 'font-bold text-white' : 'text-[var(--muted)]'}`}>
                {new Date(x.k + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'narrow' })}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Bilan du soir */}
      <Card title="📋 Bilan du soir" right={day.closed ? <span className="text-xs text-[var(--green)]">clôturé</span> : undefined}>
        <div className="mb-3 flex items-center gap-2 text-sm">
          Moral :
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={`${btn} ${day.mood === n ? 'border-[var(--violet)] bg-[var(--violet-dim)]' : ''}`}
              onClick={() => update(d => ({ ...d, mood: n }))}>{['😞', '😕', '😐', '🙂', '😄'][n - 1]}</button>
          ))}
        </div>
        <textarea value={day.feedback} onChange={e => update(d => ({ ...d, feedback: e.target.value }))}
          placeholder="Ton retour : qu’est-ce qui a été dur ? Pourquoi ?"
          rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm outline-none" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={btn + ' bg-[var(--violet)] text-white'} onClick={() => update(d => ({ ...d, closed: true }))}>Terminer la journée</button>
          <button className={btn} onClick={async () => {
            try { await navigator.clipboard.writeText(reportText(date, store)); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
          }}>{copied ? 'Copié ✓' : 'Copier le bilan pour Claude'}</button>
        </div>

        {day.closed && (
          <div className="mt-4 space-y-2 rounded-xl bg-[var(--surface)] p-3 text-sm">
            <div className="font-semibold">🤖 Coach</div>
            {advice.map((a, i) => <p key={i}>{a}</p>)}
            <p className="pt-1 text-xs text-[var(--muted)]">Pour un conseil sur-mesure : « Copier le bilan », colle-le dans Claude avec ton ressenti.</p>
          </div>
        )}
      </Card>
    </main>
  )
}
