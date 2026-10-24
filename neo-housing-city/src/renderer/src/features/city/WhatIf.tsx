import { useEffect, useState } from 'react'
import { levelFor, requiredFor } from '@/modules/game/progress'
import { simulate } from '@/modules/game/simulate'
import { HEALTH_COLORS, HEALTH_LABELS, euroFmt, finance, health, pctFmt, portfolio, type Property } from '@/modules/housing/properties'
import { propertyStore, useProperties } from '@/modules/housing/propertyStore'

// Simulateur « Et si je facturais… » : effet immédiat sur la marge, le niveau et le repère 3D. Rien n'est enregistré sans confirmation.
export function WhatIf({ p }: { p: Property }) {
  const all = useProperties()
  const [billed, setBilled] = useState(p.billed)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { setBilled(p.billed); setConfirm(false) }, [p.buildingId, p.billed])
  useEffect(() => () => simulate.set(null), [])
  useEffect(() => { simulate.set(billed !== p.billed ? { id: p.buildingId, billed } : null) }, [billed, p.billed, p.buildingId])

  const sim = { ...p, billed }
  const f0 = finance(p), f1 = finance(sim)
  const dm = Math.round((f1.margin - f0.margin) * 100) / 100
  const lvl0 = levelFor(portfolio(all).margin)
  const lvl1 = levelFor(portfolio(all.map((x) => (x.buildingId === p.buildingId ? sim : x))).margin)
  const h1 = health(sim)
  const min = Math.max(0, Math.floor((p.billed * 0.6) / 10) * 10)
  const max = Math.ceil((p.billed * 1.4) / 10) * 10
  const r15 = requiredFor(p, 0.15), r30 = requiredFor(p, 0.3)

  return (
    <section className="fiche__block whatif">
      <h3>Et si je facturais…</h3>
      <div className="whatif__price">
        <strong>{euroFmt.format(billed)}</strong><span>/ mois</span>
      </div>
      <input
        id="whatif" type="range" min={min} max={max} step={10} value={billed}
        onChange={(e) => { setBilled(Number(e.target.value)); setConfirm(false) }} aria-label="Prix facturé simulé"
      />
      <div className="whatif__marks">
        {!r15.reached && <button onClick={() => setBilled(r15.billedNeeded)}>15 % → {euroFmt.format(r15.billedNeeded)}</button>}
        {!r30.reached && <button onClick={() => setBilled(r30.billedNeeded)}>30 % → {euroFmt.format(r30.billedNeeded)}</button>}
        {billed !== p.billed && <button onClick={() => setBilled(p.billed)}>Prix actuel</button>}
      </div>
      <div className="fiche__rows">
        <div className="fiche__row"><span>Marge</span><b style={{ color: HEALTH_COLORS[h1] }}>{euroFmt.format(f1.margin)} · {pctFmt(f1.rate)}</b></div>
        <div className="fiche__row"><span>Écart / mois</span><b className={dm > 0 ? 'up' : dm < 0 ? 'down' : ''}>{dm > 0 ? '+' : ''}{euroFmt.format(dm)}</b></div>
        <div className="fiche__row"><span>Écart / an</span><b className={dm > 0 ? 'up' : dm < 0 ? 'down' : ''}>{dm > 0 ? '+' : ''}{euroFmt.format(dm * 12)}</b></div>
        <div className="fiche__row"><span>Repère</span><b style={{ color: HEALTH_COLORS[h1] }}>{HEALTH_LABELS[h1]}</b></div>
        <div className="fiche__row"><span>Niveau du portefeuille</span>
          <b className={lvl1.index > lvl0.index ? 'up' : lvl1.index < lvl0.index ? 'down' : ''}>{lvl1.name}{lvl1.index !== lvl0.index ? ` (au lieu de ${lvl0.name})` : ''}</b>
        </div>
      </div>
      {billed !== p.billed && (
        <div className="fiche__actions">
          {confirm ? (
            <>
              <button className="fiche__primary" onClick={() => { propertyStore.update(p.buildingId, { billed }); setConfirm(false) }}>
                Confirmer : facturer {euroFmt.format(billed)}
              </button>
              <button onClick={() => setConfirm(false)}>Annuler</button>
            </>
          ) : <button onClick={() => setConfirm(true)}>Appliquer ce prix à la fiche…</button>}
        </div>
      )}
      <p className="fiche__muted fiche__small">Simulation : la fiche n'est modifiée qu'après confirmation.</p>
    </section>
  )
}
