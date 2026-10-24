import { useEffect, useMemo, useRef, useState } from 'react'
import { achievements, levelFor, monthAccrual, quests, ranking, LEVELS, type Quest } from '@/modules/game/progress'
import { HEALTH_COLORS, euroFmt, health, pctFmt, portfolio } from '@/modules/housing/properties'
import { useProperties } from '@/modules/housing/propertyStore'
import { selection } from '@/modules/housing/selection'

const goTo = (id: string) => { selection.select(id); selection.onSelect?.(id) }
const KEY = 'neo.game.panel'

// Compteur façon « compteur kilométrique » : les 2 dernières décimales défilent en continu.
const fmt4 = (n: number) => n.toLocaleString('fr-BE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

function LiveCounter({ margin }: { margin: number }) {
  const main = useRef<HTMLSpanElement>(null)
  const tail = useRef<HTMLSpanElement>(null)
  const a0 = monthAccrual(margin, new Date())
  const split = (n: number) => { const s = fmt4(n); return [s.slice(0, -2), s.slice(-2)] }
  const [m0, t0] = split(a0.amount)
  useEffect(() => {
    const id = setInterval(() => {
      const [m, t] = split(monthAccrual(margin, new Date()).amount)
      if (main.current) main.current.textContent = m
      if (tail.current) tail.current.textContent = t
    }, 80)
    return () => clearInterval(id)
  }, [margin])
  const perHour = a0.perSecond * 3600
  return (
    <div className="game__live" title="Estimation au prorata du temps écoulé ce mois-ci. Ce n'est pas un encaissement réel.">
      <small>Marge générée en {a0.monthName} · jour {a0.day}/{a0.daysInMonth}</small>
      <strong><span ref={main}>{m0}</span><span className="game__tail" ref={tail}>{t0}</span> €</strong>
      <div className="game__monthbar"><i style={{ width: `${a0.fraction * 100}%` }} /></div>
      <span>≈ {euroFmt.format(perHour)} / heure · {euroFmt.format(perHour * 24)} / jour · estimation, pas un encaissement</span>
    </div>
  )
}

function QuestCard({ q }: { q: Quest }) {
  const kind = { data: 'Données', finance: 'Finances', level: 'Niveau' }[q.kind]
  return (
    <div className={`quest quest--${q.kind}${q.done ? ' is-done' : ''}`}>
      <div className="quest__top">
        <span className="quest__chip">{kind}</span>
        {q.done && <span className="quest__ok">Accompli</span>}
      </div>
      <b>{q.title}</b>
      <span className="quest__detail">{q.detail}</span>
      {q.progress && (
        <div className="quest__bar">
          <i style={{ width: `${(q.progress[0] / Math.max(1, q.progress[1])) * 100}%` }} />
          <em>{q.progress[0]}/{q.progress[1]}</em>
        </div>
      )}
      {!q.done && q.targets.length > 0 && (
        <button onClick={() => goTo(q.targets[0])}>{q.targets.length > 1 ? `Aller au suivant (${q.targets.length} restants)` : 'Y aller'}</button>
      )}
    </div>
  )
}

export function GamePanel() {
  const list = useProperties()
  const t = portfolio(list)
  const lvl = levelFor(t.margin)
  const ach = useMemo(() => achievements(list), [list])
  const qs = useMemo(() => quests(list), [list])
  const [tab, setTab] = useState<'quests' | 'trophies' | 'ranking'>('quests')
  const [sortBy, setSortBy] = useState<'margin' | 'rate'>('margin')
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(KEY) !== 'closed' } catch { return true } })
  useEffect(() => { try { localStorage.setItem(KEY, open ? 'open' : 'closed') } catch { /* idem */ } }, [open])

  const unlocked = ach.filter((a) => a.unlocked).length
  const todo = qs.filter((q) => !q.done).length
  const rank = ranking(list, sortBy)
  const best = Math.max(...rank.map((r) => (sortBy === 'margin' ? r.f.margin : r.f.rate)), 1e-9)

  return (
    <section className={`game${open ? '' : ' is-closed'}`} aria-label="Progression">
      <header className="game__head">
        <div className="game__lvl" aria-label={`Niveau ${lvl.index + 1}`}>{lvl.index + 1}</div>
        <div className="game__title">
          <small>Niveau {lvl.index + 1} sur {LEVELS.length}</small>
          <b>{lvl.name}</b>
          <div className="game__xp"><i style={{ width: `${lvl.progress * 100}%` }} /></div>
          <span>{lvl.next ? `${euroFmt.format(lvl.missing)} de marge mensuelle avant ${lvl.next.name}` : 'Niveau maximum atteint'}</span>
        </div>
        <button className="game__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={open ? 'Réduire' : 'Agrandir'}>{open ? '–' : '+'}</button>
      </header>
      {open && (
        <>
          <LiveCounter margin={t.margin} />
          <nav className="game__tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'quests'} onClick={() => setTab('quests')}>Objectifs <em>{todo}</em></button>
            <button role="tab" aria-selected={tab === 'trophies'} onClick={() => setTab('trophies')}>Trophées <em>{unlocked}/{ach.length}</em></button>
            <button role="tab" aria-selected={tab === 'ranking'} onClick={() => setTab('ranking')}>Classement</button>
          </nav>
          <div className="game__body">
            {tab === 'quests' && [...qs].sort((a, b) => Number(a.done) - Number(b.done)).map((q) => <QuestCard key={q.id} q={q} />)}
            {tab === 'trophies' && (
              <div className="trophies">
                {ach.map((a) => (
                  <div key={a.id} className={`trophy${a.unlocked ? ' is-on' : ''}`} title={a.desc}>
                    <div className="trophy__medal">{a.unlocked ? '★' : '☆'}</div>
                    <b>{a.title}</b>
                    <span>{a.desc}</span>
                    {!a.unlocked && a.progress && (
                      <div className="quest__bar"><i style={{ width: `${(a.progress[0] / a.progress[1]) * 100}%` }} /><em>{a.progress[1] >= 1000 ? `${Math.round((a.progress[0] / a.progress[1]) * 100)} %` : `${a.progress[0]}/${a.progress[1]}`}</em></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {tab === 'ranking' && (
              <>
                <div className="rank__sort">
                  Trier par
                  <button aria-pressed={sortBy === 'margin'} onClick={() => setSortBy('margin')}>Marge en €</button>
                  <button aria-pressed={sortBy === 'rate'} onClick={() => setSortBy('rate')}>Taux de marge</button>
                </div>
                <ol className="rank">
                  {rank.map(({ p, f }, i) => {
                    const val = sortBy === 'margin' ? f.margin : f.rate
                    return (
                      <li key={p.buildingId}>
                        <button onClick={() => goTo(p.buildingId)}>
                          <span className={`rank__pos rank__pos--${i + 1}`}>{i + 1}</span>
                          <span className="rank__name"><b>{p.name}</b><small>{p.address}</small>
                            <span className="rank__bar"><i style={{ width: `${Math.max(2, (val / best) * 100)}%`, background: HEALTH_COLORS[health(p)] }} /></span>
                          </span>
                          <span className="rank__val">{sortBy === 'margin' ? euroFmt.format(f.margin) : pctFmt(f.rate)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </>
            )}
          </div>
        </>
      )}
    </section>
  )
}
