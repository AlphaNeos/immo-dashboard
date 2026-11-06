'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  OFFICE_GOAL, PROTEIN_GOAL, STORAGE_KEY, STEPS_GOAL, WATER_GOAL, WEEKLY,
  addDays, coachAdvice, logicalDay, migrate as migrateStore, weekSummary, currentWeight, emptyDay, eff, fmtClock, fmtH, migrate,
  reportText, scoreOn, sleepFor, suppMinutes, tasksFor, weekCount,
  type Day, type Store,
} from './logic'

// ───────────────────────── Persistance ─────────────────────────
function useStore() {
  const [store, setStore] = useState<Store | null>(null)
  useEffect(() => {
    let s: Store
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      s = migrate(raw ? JSON.parse(raw) : null)
    } catch {
      s = migrate(null)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore(s)
  }, [])
  useEffect(() => {
    if (!store) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
  }, [store])
  return [store, setStore] as const
}

// ───────────────────────── UI bits ─────────────────────────
function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
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
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  )
}
const btn = 'rounded-xl bg-[var(--surface)] px-3 py-2 text-sm font-semibold border border-[var(--border)] active:scale-95 hover:border-[var(--violet)] transition'
const input = 'min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none'

function Check({ checked, onChange, children, right }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
      <input type="checkbox" className="h-5 w-5 shrink-0 accent-[var(--violet)]" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className={`flex-1 ${checked ? 'line-through opacity-50' : ''}`}>{children}</span>
      {right}
    </label>
  )
}

function WeightChart({ store }: { store: Store }) {
  const { weights, goalWeight } = store.settings
  const pts = Object.entries(weights).sort(([a], [b]) => a.localeCompare(b))
  if (pts.length < 2) return <p className="text-xs text-[var(--muted)]">Ajoute une pesée dans quelques jours pour voir la courbe.</p>
  const vals = pts.map(([, v]) => v)
  const max = Math.max(...vals, goalWeight) + 1
  const min = Math.min(...vals, goalWeight) - 1
  const W = 300, H = 90
  const x = (i: number) => (i / (pts.length - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full overflow-visible">
      <line x1="0" x2={W} y1={y(goalWeight)} y2={y(goalWeight)} stroke="var(--green)" strokeDasharray="4 4" />
      <polyline fill="none" stroke="var(--violet)" strokeWidth="2.5" points={pts.map(([, v], i) => `${x(i)},${y(v)}`).join(' ')} />
      {pts.map(([, v], i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--violet)" />)}
    </svg>
  )
}

// ───────────────────────── Page ─────────────────────────
export default function CoachPage() {
  const [store, setStore] = useStore()
  const [date, setDate] = useState(() => logicalDay())
  const [now, setNow] = useState(() => new Date())
  const [cNote, setCNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [wInput, setWInput] = useState('')
  const [stepsInput, setStepsInput] = useState('')
  const [suppName, setSuppName] = useState('')
  const [suppTime, setSuppTime] = useState('09:00')
  const [suppAnchor, setSuppAnchor] = useState<'fixed' | 'wake' | 'bed'>('wake')
  const [suppOffset, setSuppOffset] = useState('60')
  const [notif, setNotif] = useState<'default' | 'granted' | 'denied' | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const today = logicalDay(now)

  // Import automatique : /coach?steps=4200 (raccourci iPhone / Tasker) règle les pas d'aujourd'hui
  const imported = useRef(false)
  useEffect(() => {
    if (!store || imported.current) return
    imported.current = true
    const v = parseInt(new URLSearchParams(window.location.search).get('steps') ?? '')
    if (Number.isNaN(v) || v < 0 || v > 100000) return
     
    setStore(st => (st ? { ...st, days: { ...st.days, [logicalDay()]: { ...(st.days[logicalDay()] ?? emptyDay()), steps: v } } } : st))
    window.history.replaceState(null, '', window.location.pathname)
  }, [store, setStore])
  const prevToday = useRef(today)
  useEffect(() => {
    if (prevToday.current !== today) {
       
      setDate(d => (d === prevToday.current ? today : d))
      prevToday.current = today
    }
  }, [today])
  const isToday = date === today
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const update = useCallback((fn: (d: Day) => Day) => {
    setStore(s => (s ? { ...s, days: { ...s.days, [date]: fn(s.days[date] ?? emptyDay()) } } : s))
  }, [date, setStore])

  const tasks = useMemo(() => (store ? tasksFor(date, store) : []), [store, date])
  const day = store?.days[date] ?? emptyDay()

  // Notifications (onglet ouvert)
  useEffect(() => {
    if (!store || !isToday || notif !== 'granted') return
    const todayDone = store.days[today]?.done ?? {}
    for (const t of tasksFor(today, store)) {
      if (fmtClock(t.min) === hhmm && !todayDone[t.id]) {
        try { new Notification(`${t.emoji} ${t.label}`, { tag: t.id }) } catch { /* ignore */ }
      }
    }
  }, [hhmm]) // eslint-disable-line react-hooks/exhaustive-deps

  const { pts, pct } = store ? scoreOn(date, store) : { pts: 0, pct: 0 }
  const totalXp = useMemo(() => (store ? Object.keys(store.days).reduce((a, k) => a + scoreOn(k, store).pts, 0) : 0), [store])
  const level = Math.floor(totalXp / 300) + 1
  const streak = useMemo(() => {
    if (!store) return 0
    let n = 0
    let cur = today
    if (!store.days[cur] || scoreOn(cur, store).pct < 60) cur = addDays(cur, -1)
    while (store.days[cur] && scoreOn(cur, store).pct >= 60) { n++; cur = addDays(cur, -1) }
    return n
  }, [store, today])
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const k = addDays(date, i - 6)
    return { k, pct: store && store.days[k] ? scoreOn(k, store).pct : 0 }
  }), [store, date])

  if (!store) return <main className="p-6 text-[var(--muted)]">Chargement…</main>

  const { settings: S } = store
  const sl = sleepFor(date, S.sleep)
  const nowEff = eff(now.getHours() * 60 + now.getMinutes())
  const overdue = isToday ? tasks.filter(t => eff(t.min) < nowEff && !day.done[t.id]) : []
  const nextTask = isToday ? tasks.find(t => eff(t.min) >= nowEff && !day.done[t.id]) : undefined
  const cw = currentWeight(store)
  const lost = S.startWeight - cw
  const weeksLeft = Math.max(0, Math.ceil((cw - S.goalWeight) / 0.5))
  const advice = day.closed ? coachAdvice(date, store) : []
  const setSettings = (fn: (s: typeof S) => typeof S) => setStore(st => (st ? { ...st, settings: fn(st.settings) } : st))

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
            <button className={btn} onClick={() => setDate(today)}>Auj.</button>
            <button className={btn} onClick={() => setDate(addDays(date, 1))} disabled={isToday}>→</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">🔥 {streak}</div><div className="text-[11px] text-[var(--muted)]">jours d’affilée</div></div>
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">Niv. {level}</div><div className="text-[11px] text-[var(--muted)]">{totalXp % 300}/300 XP</div></div>
          <div className="rounded-xl bg-[var(--card)] p-2"><div className="text-xl font-bold">{pct}%</div><div className="text-[11px] text-[var(--muted)]">{pts} pts</div></div>
        </div>
        <Bar pct={pct} color={pct >= 85 ? 'var(--green)' : pct >= 60 ? 'var(--violet)' : 'var(--amber)'} />
      </header>

      {isToday && (overdue.length > 0 || nextTask) && (
        <div className="rounded-2xl border border-[var(--violet)] bg-[var(--violet-dim)] p-3 text-sm">
          {overdue.length > 0 && <div>⏳ En retard : {overdue.map(t => `${t.emoji} ${t.label}`).join(' · ')}</div>}
          {nextTask && <div className="text-[var(--muted)]">Prochain : {nextTask.emoji} {nextTask.label} à {fmtClock(nextTask.min)}</div>}
        </div>
      )}
      {notif === 'default' && (
        <button className={btn + ' w-full'} onClick={async () => setNotif(await Notification.requestPermission())}>
          🔔 Activer les rappels (garde cet onglet ouvert)
        </button>
      )}

      {/* Sommeil */}
      <Card title="🌙 Plan sommeil progressif" right={<span className="text-xs text-[var(--muted)]">{sl.done ? 'objectif atteint 🎉' : `prochain cran dans ${sl.nextIn} j`}</span>}>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-[var(--surface)] p-3"><div className="text-xs text-[var(--muted)]">Lever</div><div className="text-2xl font-bold">{fmtClock(sl.wake)}</div></div>
          <div className="rounded-xl bg-[var(--surface)] p-3"><div className="text-xs text-[var(--muted)]">Coucher</div><div className="text-2xl font-bold">{fmtClock(sl.bed)}</div></div>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Départ 03:00 → 00:30 (coucher) et 10:30 → 08:00 (lever), −{S.sleep.stepMin} min tous les {S.sleep.everyDays} jours. Lumière vive + eau dès le lever, pas de café après 14h.
        </p>
        {!sl.done && (
          <button className={btn + ' mt-2'} onClick={() => setSettings(s => ({ ...s, sleep: { ...s.sleep, startDate: addDays(s.sleep.startDate, 3) } }))}>
            Trop dur : garder cet horaire 3 jours de plus
          </button>
        )}
      </Card>

      {/* Programme */}
      <Card title="📅 Programme du jour">
        <ul className="space-y-2">
          {tasks.map(t => (
            <li key={t.id}>
              <Check checked={!!day.done[t.id]} onChange={v => update(d => ({ ...d, done: { ...d.done, [t.id]: v } }))}
                right={<span className="text-xs text-[var(--muted)]">{fmtClock(t.min)} · +{t.points}</span>}>
                {t.emoji} {t.label}
                {t.hint && <span className="block text-[11px] text-[var(--muted)]">{t.hint}</span>}
              </Check>
            </li>
          ))}
        </ul>
        {S.supplements.length === 0 && <p className="mt-2 text-xs text-[var(--amber)]">Aucun complément enregistré : ajoute-les plus bas (section Réglages).</p>}
      </Card>

      {/* Eau */}
      <Card title="💧 Eau — objectif 2 L" right={<span className="text-sm font-bold">{(day.water / 1000).toFixed(2)} L</span>}>
        <Bar pct={(day.water / WATER_GOAL) * 100} color="#38BDF8" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[250, 500, 750].map(ml => <button key={ml} className={btn} onClick={() => update(d => ({ ...d, water: d.water + ml }))}>+{ml} ml</button>)}
          <button className={btn} onClick={() => update(d => ({ ...d, water: Math.max(0, d.water - 250) }))}>−250</button>
        </div>
        {day.water >= WATER_GOAL && <p className="mt-2 text-sm text-[var(--green)]">✅ Objectif eau atteint !</p>}
      </Card>

      {/* Protéines */}
      <Card title="🥚 Protéines — sans te priver" right={<span className="text-sm font-bold">{day.protein} / {PROTEIN_GOAL} g</span>}>
        <Bar pct={(day.protein / PROTEIN_GOAL) * 100} color="var(--green)" />
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 20, 30].map(g => <button key={g} className={btn} onClick={() => update(d => ({ ...d, protein: d.protein + g }))}>+{g} g</button>)}
          <button className={btn} onClick={() => update(d => ({ ...d, protein: Math.max(0, d.protein - 10) }))}>−10</button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Repères : 1 œuf ≈ 6 g · poulet 100 g ≈ 25 g · skyr 150 g ≈ 15 g · thon 1 boîte ≈ 25 g.</p>
      </Card>

      {/* Bureau */}
      <Card title="🏢 Travail — objectif 4h" right={<span className="text-sm font-bold">{fmtH(day.officeMin)}</span>}>
        <Bar pct={(day.officeMin / OFFICE_GOAL) * 100} color="var(--gold)" />
        <div className="mt-3 flex gap-2">
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: d.officeMin + 30 }))}>+30 min</button>
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: d.officeMin + 60 }))}>+1h</button>
          <button className={btn} onClick={() => update(d => ({ ...d, officeMin: Math.max(0, d.officeMin - 30) }))}>−30</button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Bloc 1 : midi → crèche (15h30). Bloc 2 : après la crèche, 2–3h. Au-delà de 4h = bonus, pas obligation.</p>
      </Card>

      {/* Sport */}
      <Card title="🏃 Mouvement">
        <div className="mb-1 flex justify-between text-sm"><span>🚶 Pas</span><b>{day.steps.toLocaleString('fr-FR')} / {STEPS_GOAL.toLocaleString('fr-FR')}</b></div>
        <Bar pct={(day.steps / STEPS_GOAL) * 100} color="var(--green)" />
        <button className={btn + ' mt-3 w-full ' + (day.steps >= STEPS_GOAL ? 'border-[var(--green)] text-[var(--green)]' : 'bg-[var(--violet)] text-white')}
          onClick={() => update(d => ({ ...d, steps: d.steps >= STEPS_GOAL ? 0 : STEPS_GOAL }))}>
          {day.steps >= STEPS_GOAL ? '✅ 5000 pas faits (toucher pour annuler)' : '🚶 J’ai fait mes 5000 pas'}
        </button>
        <form className="mt-2 flex gap-2" onSubmit={e => {
          e.preventDefault()
          const v = parseInt(stepsInput.replace(/\s/g, ''))
          if (Number.isNaN(v) || v < 0 || v > 100000) return
          update(d => ({ ...d, steps: v }))
          setStepsInput('')
        }}>
          <input className={input + ' flex-1'} inputMode="numeric" placeholder="Ou le nombre exact (ex : 6200)" value={stepsInput} onChange={e => setStepsInput(e.target.value)} />
          <button className={btn} type="submit">Définir</button>
        </form>
        <div className="mt-3 space-y-2">
          {([
            ['padel', '🎾 Padel', WEEKLY.padel, '+25'],
            ['kine', '🩺 Kiné', WEEKLY.kine, '+15'],
            ['renfo', '🦵 Renfo jambes', WEEKLY.renfo, '+20'],
          ] as const).map(([key, label, goal, pt]) => (
            <Check key={key} checked={day[key]} onChange={v => update(d => ({ ...d, [key]: v }))}
              right={<span className="text-xs text-[var(--muted)]">{weekCount(date, store, key)}/{goal} sem. · {pt}</span>}>
              {label}
            </Check>
          ))}
        </div>
      </Card>

      {/* Poids */}
      <Card title="⚖️ Poids" right={<span className="text-sm font-bold">{cw} kg → {S.goalWeight}</span>}>
        <Bar pct={((S.startWeight - cw) / (S.startWeight - S.goalWeight)) * 100} color="var(--violet)" />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {lost >= 0 ? `−${lost.toFixed(1)} kg depuis le début` : `+${(-lost).toFixed(1)} kg depuis le début`} · à −0,5 kg/sem. ≈ {weeksLeft} semaines restantes. Pèse-toi 1 fois/semaine, même jour, au réveil.
        </p>
        <div className="mt-3"><WeightChart store={store} /></div>
        <form className="mt-3 flex gap-2" onSubmit={e => {
          e.preventDefault()
          const v = parseFloat(wInput.replace(',', '.'))
          if (!v || v < 30 || v > 300) return
          setSettings(s => ({ ...s, weights: { ...s.weights, [date]: v } }))
          setWInput('')
        }}>
          <input className={input + ' flex-1'} inputMode="decimal" placeholder="Poids du jour (kg)" value={wInput} onChange={e => setWInput(e.target.value)} />
          <button className={btn} type="submit">Enregistrer</button>
        </form>
      </Card>

      {/* Craquages */}
      <Card title="🍫 Craquages (sans jugement)" right={<span className="text-xs text-[var(--muted)]">−5 pts, « plaisir prévu » = 0</span>}>
        <input value={cNote} onChange={e => setCNote(e.target.value)} placeholder="Quoi / pourquoi ? (optionnel)" className={input + ' w-full'} />
        <div className="mt-2 flex flex-wrap gap-2">
          {(['sucre', 'gras', 'autre', 'plaisir'] as const).map(type => (
            <button key={type} className={btn} onClick={() => { update(d => ({ ...d, cravings: [...d.cravings, { type, note: cNote, t: hhmm }] })); setCNote('') }}>
              + {type === 'plaisir' ? 'plaisir prévu' : type}
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

      {/* Bilan de la semaine */}
      <WeekCard store={store} date={date} />

      {/* Bilan */}
      <Card title="📋 Bilan du soir" right={day.closed ? <span className="text-xs text-[var(--green)]">clôturé</span> : undefined}>
        <div className="mb-3 flex items-center gap-2 text-sm">
          Moral :
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} className={`${btn} ${day.mood === n ? 'border-[var(--violet)] bg-[var(--violet-dim)]' : ''}`}
              onClick={() => update(d => ({ ...d, mood: n }))}>{['😞', '😕', '😐', '🙂', '😄'][n - 1]}</button>
          ))}
        </div>
        <textarea value={day.feedback} onChange={e => update(d => ({ ...d, feedback: e.target.value }))}
          placeholder="Ton retour : qu’est-ce qui a été dur ? Pourquoi ?" rows={3}
          className={input + ' w-full'} />
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

      {/* Réglages */}
      <Card title="⚙️ Réglages — compléments">
        <ul className="mb-3 space-y-2">
          {S.supplements.map(sp => (
            <li key={sp.id} className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
              <span>💊 {sp.name} · {fmtClock(suppMinutes(sp, sl))}</span>
              <button className="text-[var(--muted)]" onClick={() => setSettings(s => ({ ...s, supplements: s.supplements.filter(x => x.id !== sp.id) }))}>✕</button>
            </li>
          ))}
        </ul>
        <form className="flex flex-wrap gap-2" onSubmit={e => {
          e.preventDefault()
          if (!suppName.trim()) return
          setSettings(s => ({ ...s, supplements: [...s.supplements, {
            id: String(Date.now()), name: suppName.trim(), time: suppTime,
            ...(suppAnchor === 'fixed' ? {} : { anchor: suppAnchor, offset: (parseInt(suppOffset) || 0) * (suppAnchor === 'bed' ? -1 : 1) }),
          }] }))
          setSuppName('')
        }}>
          <input className={input + ' flex-1'} placeholder="Nom + dose (ex : Magnésium 300 mg)" value={suppName} onChange={e => setSuppName(e.target.value)} />
          <select className={input} value={suppAnchor} onChange={e => setSuppAnchor(e.target.value as 'fixed' | 'wake' | 'bed')}>
            <option value="wake">après le lever</option>
            <option value="bed">avant le coucher</option>
            <option value="fixed">heure fixe</option>
          </select>
          {suppAnchor === 'fixed'
            ? <input className={input} type="time" value={suppTime} onChange={e => setSuppTime(e.target.value || '09:00')} />
            : <input className={input + ' w-20'} inputMode="numeric" value={suppOffset} onChange={e => setSuppOffset(e.target.value)} aria-label="minutes" placeholder="min" />}
          <button className={btn} type="submit">Ajouter</button>
        </form>
        <p className="mt-2 text-xs text-[var(--muted)]">Les heures suivent ton plan sommeil (ex : « avant le coucher, 75 min »). Respecte les doses de l’étiquette ou de ton pharmacien.</p>
      </Card>

      <BackupCard store={store} onImport={s => setStore(s)} />
    </main>
  )
}

function WeekCard({ store, date }: { store: Store; date: string }) {
  const w = weekSummary(date, store)
  const row = (label: string, v: string) => (
    <div className="flex justify-between rounded-lg bg-[var(--surface)] px-3 py-2 text-sm"><span>{label}</span><b>{v}</b></div>
  )
  return (
    <Card title="🗓️ Cette semaine" right={<span className="text-xs text-[var(--muted)]">{w.days} jour(s) suivis</span>}>
      {w.days === 0 ? <p className="text-sm text-[var(--muted)]">Pas encore de données cette semaine.</p> : (
        <div className="space-y-2">
          {row('Score moyen', `${w.avgScore}%`)}
          {row('Jours ≥ 60 %', `${w.goodDays}/${w.days}`)}
          {row('Eau moyenne', `${w.avgWaterL} L`)}
          {row('Protéines moyennes', `${w.avgProtein} g`)}
          {row('Jours à 5000 pas', `${w.stepsDays}/${w.days}`)}
          {row('Padel · Kiné · Renfo', `${w.padel}/2 · ${w.kine}/2 · ${w.renfo}/1`)}
          {row('Craquages (hors plaisir prévu)', String(w.cravings))}
          {w.weightDelta !== undefined && row('Poids sur la semaine', `${w.weightDelta > 0 ? '+' : ''}${w.weightDelta} kg`)}
        </div>
      )}
    </Card>
  )
}

function BackupCard({ store, onImport }: { store: Store; onImport: (s: Store) => void }) {
  const [msg, setMsg] = useState('')
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `coach-sauvegarde-${logicalDay()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Sauvegarde téléchargée ✓')
  }
  const importJson = async (f: File | undefined) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (!data || typeof data !== 'object' || !data.days) throw new Error('format')
      if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return
      onImport(migrateStore(data))
      setMsg('Sauvegarde importée ✓')
    } catch {
      setMsg('Fichier invalide, rien n’a été changé.')
    }
  }
  return (
    <Card title="💾 Sauvegarde">
      <p className="mb-3 text-xs text-[var(--muted)]">Tes données sont uniquement dans ce navigateur. Télécharge une sauvegarde de temps en temps (et pour passer d’un appareil à l’autre).</p>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={exportJson}>Exporter (.json)</button>
        <label className={btn + ' cursor-pointer'}>
          Importer
          <input type="file" accept="application/json,.json" className="hidden" onChange={e => { importJson(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </Card>
  )
}
