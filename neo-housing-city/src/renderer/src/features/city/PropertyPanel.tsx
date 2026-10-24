import { useEffect, useState } from 'react'
import { cameraStore } from '@/modules/city/cameraStore'
import {
  HEALTH_COLORS, HEALTH_LABELS, STATE_LABELS, euroFmt, finance, health, pctFmt, validateEditable,
  type OccupancyState, type Property, type Studio
} from '@/modules/housing/properties'
import { propertyStore, useProperties } from '@/modules/housing/propertyStore'
import { selection, useSelection } from '@/modules/housing/selection'
import { WhatIf } from './WhatIf'

const TODO = <em className="fiche__todo">À renseigner</em>

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="fiche__row">
      <span>{label}</span>
      <b>{children}</b>
    </div>
  )
}

function Money({ v }: { v: number }) { return <>{euroFmt.format(v)}</> }

function Figures({ p }: { p: Property }) {
  const f = finance(p)
  const col = HEALTH_COLORS[health(p)]
  return (
    <section className="fiche__block">
      <h3>Ce que le bien rapporte</h3>
      <div className="fiche__figures">
        <div><small>Facturé / mois</small><strong><Money v={f.billed} /></strong></div>
        <div><small>Coûts / mois</small><strong><Money v={f.cost} /></strong></div>
        <div className="fiche__margin" style={{ borderColor: col }}>
          <small>Marge brute / mois</small>
          <strong style={{ color: col }}><Money v={f.margin} /></strong>
          <span>{pctFmt(f.rate)} du facturé · ≈ {euroFmt.format(f.yearlyMargin)} / an</span>
        </div>
      </div>
      <div className="fiche__rows">
        <Row label="Loyer payé au propriétaire"><Money v={p.rent} /></Row>
        <Row label="Charges">{p.chargesIncluded ? <span className="fiche__muted">comprises dans le loyer</span> : <Money v={p.charges} />}</Row>
        <Row label="Nettoyage">{p.cleaning > 0 ? <Money v={p.cleaning} /> : <span className="fiche__muted">aucun</span>}</Row>
        <Row label="Total des coûts"><Money v={f.cost} /></Row>
      </div>
    </section>
  )
}

function StudioList({ p }: { p: Property }) {
  const { studioId } = useSelection()
  if (!p.studios) return null
  const cur = p.studios.find((s) => s.id === studioId)
  return (
    <section className="fiche__block">
      <h3>Les {p.studios.length} studios</h3>
      <p className="fiche__muted fiche__small">Les montants ci-dessus concernent l'immeuble entier. Les montants par studio ne sont pas renseignés.</p>
      <div className="fiche__studios">
        {p.studios.map((s) => (
          <button key={s.id} className={s.id === studioId ? 'is-on' : ''} onClick={() => selection.selectStudio(s.id === studioId ? null : s.id)}>
            <b>{s.label}</b>
            <span>{s.occupant ?? 'Occupant à renseigner'}</span>
          </button>
        ))}
      </div>
      {cur && (
        <div className="fiche__rows fiche__studio-detail">
          <Row label="Occupant">{cur.occupant ?? TODO}</Row>
          <Row label="Fin de contrat">{cur.contractEnd ? new Date(cur.contractEnd).toLocaleDateString('fr-BE') : TODO}</Row>
          <Row label="Facturation individuelle">{cur.monthlyBilled != null ? euroFmt.format(cur.monthlyBilled) : TODO}</Row>
        </div>
      )}
    </section>
  )
}

const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))

function EditForm({ p, onDone }: { p: Property; onDone: () => void }) {
  const [v, setV] = useState({
    owner: p.owner ?? '', clientCompany: p.clientCompany ?? '', state: p.state,
    bedrooms: p.bedrooms == null ? '' : String(p.bedrooms),
    billed: String(p.billed), rent: String(p.rent), charges: String(p.charges), cleaning: String(p.cleaning), chargesIncluded: p.chargesIncluded
  })
  const [studios, setStudios] = useState<Studio[]>(p.studios ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: string, val: string | boolean) => setV((o) => ({ ...o, [k]: val }))

  const save = () => {
    const patch = {
      owner: v.owner.trim() || null, clientCompany: v.clientCompany.trim() || null, state: v.state as OccupancyState,
      bedrooms: v.bedrooms.trim() === '' ? null : num(v.bedrooms),
      billed: num(v.billed), rent: num(v.rent), charges: v.chargesIncluded ? 0 : num(v.charges), cleaning: num(v.cleaning),
      chargesIncluded: v.chargesIncluded,
      ...(p.studios ? { studios: studios.map((s) => ({ ...s, occupant: s.occupant?.trim() || null, contractEnd: s.contractEnd || null })) } : {})
    }
    const local = validateEditable(patch)
    const required = (['billed', 'rent', 'cleaning'] as const).filter((k) => Number.isNaN(patch[k]))
    for (const k of required) local[k] = 'Montant obligatoire (0 si aucun)'
    if (Number.isNaN(patch.charges)) local.charges = 'Montant obligatoire (0 si aucun)'
    if (Object.keys(local).length) return setErrors(local)
    const res = propertyStore.update(p.buildingId, patch)
    if (Object.keys(res).length) return setErrors(res)
    onDone()
  }

  const field = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="fiche__field">
      <span>{label}</span>
      <input id={`f-${k}`} value={(v as Record<string, unknown>)[k] as string} onChange={(e) => set(k, e.target.value)} {...props} />
      {errors[k] && <small className="fiche__error">{errors[k]}</small>}
    </label>
  )

  return (
    <form className="fiche__form" onSubmit={(e) => { e.preventDefault(); save() }}>
      {field('owner', 'Propriétaire', { maxLength: 80, placeholder: 'Nom du propriétaire' })}
      {field('clientCompany', 'Entreprise cliente', { maxLength: 80, placeholder: "Nom de l'entreprise" })}
      <label className="fiche__field">
        <span>État du logement</span>
        <select id="f-state" value={v.state} onChange={(e) => set('state', e.target.value)}>
          {Object.entries(STATE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      {field('bedrooms', 'Chambres', { inputMode: 'numeric', placeholder: 'ex. 4' })}
      {field('billed', 'Facturé au client (€ / mois)', { inputMode: 'decimal' })}
      {field('rent', 'Loyer payé au propriétaire (€ / mois)', { inputMode: 'decimal' })}
      <label className="fiche__check">
        <input id="f-incl" type="checkbox" checked={v.chargesIncluded} onChange={(e) => set('chargesIncluded', e.target.checked)} />
        Loyer charges comprises
      </label>
      {!v.chargesIncluded && field('charges', 'Charges (€ / mois)', { inputMode: 'decimal' })}
      {field('cleaning', 'Nettoyage (€ / mois)', { inputMode: 'decimal' })}
      {studios.map((s, i) => (
        <fieldset key={s.id} className="fiche__studio-form">
          <legend>{s.label}</legend>
          <label className="fiche__field"><span>Occupant</span>
            <input id={`f-${s.id}-o`} value={s.occupant ?? ''} maxLength={80} onChange={(e) => setStudios((a) => a.map((x, j) => (j === i ? { ...x, occupant: e.target.value } : x)))} />
            {errors[`${s.id}.occupant`] && <small className="fiche__error">{errors[`${s.id}.occupant`]}</small>}
          </label>
          <label className="fiche__field"><span>Fin de contrat</span>
            <input id={`f-${s.id}-c`} type="date" value={s.contractEnd ?? ''} onChange={(e) => setStudios((a) => a.map((x, j) => (j === i ? { ...x, contractEnd: e.target.value } : x)))} />
            {errors[`${s.id}.contractEnd`] && <small className="fiche__error">{errors[`${s.id}.contractEnd`]}</small>}
          </label>
        </fieldset>
      ))}
      <div className="fiche__actions">
        <button type="submit" className="fiche__primary">Enregistrer</button>
        <button type="button" onClick={onDone}>Annuler</button>
      </div>
    </form>
  )
}

function close() {
  selection.select(null)
  cameraStore.reset() // retour à la vue générale
}

export function PropertyPanel() {
  const { selectedId } = useSelection()
  const props = useProperties()
  const [editing, setEditing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const p = props.find((x) => x.buildingId === selectedId)

  useEffect(() => { setEditing(false); setConfirmReset(false) }, [selectedId])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !editing) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  if (!p) return null
  const h = health(p)
  return (
    <aside className="fiche" aria-label="Fiche du logement">
      <header className="fiche__head">
        <button className="fiche__back" onClick={close}>← Vue générale</button>
        <h2>{p.name}</h2>
        <p>{p.address}</p>
        <div className="fiche__badges">
          <span className="fiche__badge">{p.typeLabel}</span>
          <span className="fiche__badge" style={{ borderColor: HEALTH_COLORS[h], color: HEALTH_COLORS[h] }} title={HEALTH_LABELS[h]}>● {STATE_LABELS[p.state]}</span>
          {propertyStore.isModified(p.buildingId) && <span className="fiche__badge fiche__badge--mod">modifié</span>}
        </div>
      </header>
      <div className="fiche__scroll">
        {editing ? <EditForm p={p} onDone={() => setEditing(false)} /> : (
          <>
            <Figures p={p} />
            <WhatIf p={p} />
            <section className="fiche__block">
              <h3>Informations</h3>
              <div className="fiche__rows">
                <Row label="Propriétaire">{p.owner ?? TODO}</Row>
                <Row label="Entreprise cliente">{p.clientCompany ?? TODO}</Row>
                <Row label="Chambres">{p.bedrooms ?? TODO}</Row>
                <Row label="Type de logement">{p.typeLabel}</Row>
                <Row label="Repère couleur">{HEALTH_LABELS[h]}</Row>
              </div>
            </section>
            <StudioList p={p} />
            <div className="fiche__actions">
              <button className="fiche__primary" onClick={() => setEditing(true)}>Modifier</button>
              {propertyStore.isModified(p.buildingId) && (confirmReset ? (
                <>
                  <button onClick={() => { propertyStore.reset(p.buildingId); setConfirmReset(false) }}>Confirmer le retour aux valeurs d'origine</button>
                  <button onClick={() => setConfirmReset(false)}>Annuler</button>
                </>
              ) : <button onClick={() => setConfirmReset(true)}>Valeurs d'origine</button>)}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
