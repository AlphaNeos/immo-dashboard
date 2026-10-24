import { useEffect, useState } from 'react'
import type { GameEvent } from '@/modules/game/celebrate'

type T = GameEvent & { key: number }
let push: ((e: GameEvent) => void) | null = null
let seq = 0
export const toast = (e: GameEvent) => push?.(e)

const LABEL: Record<GameEvent['kind'], string> = { achievement: 'Trophée', quest: 'Objectif', level: 'Niveau' }

export function Toasts() {
  const [list, setList] = useState<T[]>([])
  useEffect(() => {
    push = (e) => {
      const t = { ...e, key: ++seq }
      setList((l) => [...l, t].slice(-4))
      setTimeout(() => setList((l) => l.filter((x) => x.key !== t.key)), 5200)
    }
    return () => { push = null }
  }, [])
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.key} className={`toast toast--${t.kind}`}>
          <small>{LABEL[t.kind]}</small>
          <b>{t.title}</b>
          <span>{t.detail}</span>
        </div>
      ))}
    </div>
  )
}
