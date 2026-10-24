// Fiches des logements gérés (données réelles de NEO HOUSING fournies par l'utilisateur).
// Tout est calculé à partir des lignes : aucune marge n'est saisie à la main.

export type OccupancyState = 'actif' | 'libre' | 'preavis' | 'travaux'

export const STATE_LABELS: Record<OccupancyState, string> = {
  actif: 'Actif · facturé',
  libre: 'Libre',
  preavis: 'Préavis en cours',
  travaux: 'En travaux'
}

export interface Studio {
  id: string
  label: string
  occupant: string | null
  contractEnd: string | null // AAAA-MM-JJ
  monthlyBilled: number | null // facturation individuelle, si disponible
}

export interface Property {
  buildingId: string
  name: string
  address: string
  typeLabel: string
  bedrooms: number | null
  owner: string | null // propriétaire (à renseigner)
  clientCompany: string | null // entreprise cliente (à renseigner)
  state: OccupancyState
  billed: number // facturation mensuelle au client
  rent: number // loyer payé au propriétaire
  charges: number // charges payées en plus du loyer
  cleaning: number // nettoyage mensuel
  chargesIncluded: boolean // loyer « charges comprises »
  studios?: Studio[]
}

const studios = (id: string): Studio[] =>
  [1, 2, 3].map((n) => ({ id: `${id}-u${n}`, label: `Studio ${n}`, occupant: null, contractEnd: null, monthlyBilled: null }))

export const SEED_PROPERTIES: Property[] = [
  {
    buildingId: 'bld-001', name: 'Maison 4 chambres', address: 'Rue du Fisch Club 41', typeLabel: 'Maison', bedrooms: 4,
    owner: null, clientCompany: null, state: 'actif', billed: 4628.79, rent: 2300, charges: 250, cleaning: 50, chargesIncluded: false
  },
  {
    buildingId: 'bld-002', name: 'Maison 4 chambres', address: 'Rue de Frameries 238', typeLabel: 'Maison', bedrooms: 4,
    owner: null, clientCompany: null, state: 'actif', billed: 4300, rent: 1800, charges: 250, cleaning: 0, chargesIncluded: false
  },
  {
    buildingId: 'bld-003', name: 'Immeuble 3 studios', address: 'Rue Antoine Clesse 27', typeLabel: 'Immeuble de rapport', bedrooms: null,
    owner: null, clientCompany: null, state: 'actif', billed: 4300, rent: 3250, charges: 0, cleaning: 0, chargesIncluded: true,
    studios: studios('bld-003')
  },
  {
    buildingId: 'bld-004', name: 'Appartement 1 chambre', address: 'Rue Émile Vandervelde 25', typeLabel: 'Appartement', bedrooms: 1,
    owner: null, clientCompany: null, state: 'actif', billed: 1350, rent: 1150, charges: 0, cleaning: 40, chargesIncluded: false
  },
  {
    buildingId: 'bld-005', name: 'Maison A', address: "Avenue de l'Hôpital 43", typeLabel: 'Maison', bedrooms: null,
    owner: null, clientCompany: null, state: 'actif', billed: 5000, rent: 2350, charges: 0, cleaning: 0, chargesIncluded: true
  },
  {
    buildingId: 'bld-006', name: 'Maison B', address: 'Rue de la Joyeuse Entrée 27', typeLabel: 'Maison', bedrooms: null,
    owner: null, clientCompany: null, state: 'actif', billed: 5200, rent: 3200, charges: 0, cleaning: 0, chargesIncluded: true
  }
]

// ---- Calculs (en centimes pour éviter les erreurs d'arrondi)
const cents = (n: number) => Math.round(n * 100)
const euros = (c: number) => c / 100

export interface Finance { billed: number; cost: number; margin: number; rate: number; yearlyMargin: number }

export function finance(p: Pick<Property, 'billed' | 'rent' | 'charges' | 'cleaning'>): Finance {
  const billed = cents(p.billed)
  const cost = cents(p.rent) + cents(p.charges) + cents(p.cleaning)
  const margin = billed - cost
  return { billed: euros(billed), cost: euros(cost), margin: euros(margin), rate: billed > 0 ? margin / billed : 0, yearlyMargin: euros(margin * 12) }
}

export function portfolio(list: Property[]): Finance {
  const billed = list.reduce((s, p) => s + cents(p.billed), 0)
  const cost = list.reduce((s, p) => s + cents(p.rent) + cents(p.charges) + cents(p.cleaning), 0)
  const margin = billed - cost
  return { billed: euros(billed), cost: euros(cost), margin: euros(margin), rate: billed > 0 ? margin / billed : 0, yearlyMargin: euros(margin * 12) }
}

// Santé financière : sert à la couleur du repère au-dessus du bâtiment.
export type Health = 'good' | 'ok' | 'low' | 'idle' | 'works'
export function health(p: Property): Health {
  if (p.state === 'libre' || p.state === 'preavis') return 'idle'
  if (p.state === 'travaux') return 'works'
  const r = finance(p).rate
  return r >= 0.3 ? 'good' : r >= 0.15 ? 'ok' : 'low'
}
export const HEALTH_COLORS: Record<Health, string> = { good: '#35d07f', ok: '#f5b942', low: '#ff6b6b', idle: '#9aa5b8', works: '#5aa9ff' }
export const HEALTH_LABELS: Record<Health, string> = {
  good: 'Marge confortable (≥ 30 %)', ok: 'Marge correcte (15–30 %)', low: 'Marge faible (< 15 %)', idle: 'Logement non facturé', works: 'En travaux'
}

// ---- Validation des champs modifiables
export type Editable = Partial<Pick<Property, 'owner' | 'clientCompany' | 'state' | 'bedrooms' | 'billed' | 'rent' | 'charges' | 'cleaning' | 'chargesIncluded'>> & {
  studios?: Studio[]
}

export function validateEditable(e: Editable): Record<string, string> {
  const err: Record<string, string> = {}
  for (const k of ['owner', 'clientCompany'] as const) {
    const v = e[k]
    if (v != null && (typeof v !== 'string' || v.length > 80)) err[k] = '80 caractères maximum'
  }
  if (e.state != null && !(e.state in STATE_LABELS)) err.state = 'État inconnu'
  if (e.bedrooms != null && (!Number.isInteger(e.bedrooms) || e.bedrooms < 0 || e.bedrooms > 30)) err.bedrooms = 'Nombre entier entre 0 et 30'
  for (const k of ['billed', 'rent', 'charges', 'cleaning'] as const) {
    const v = e[k]
    if (v != null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1_000_000)) err[k] = 'Montant entre 0 et 1 000 000 €'
  }
  for (const s of e.studios ?? []) {
    if (s.occupant != null && s.occupant.length > 80) err[`${s.id}.occupant`] = '80 caractères maximum'
    if (s.contractEnd != null && s.contractEnd !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(s.contractEnd)) err[`${s.id}.contractEnd`] = 'Date invalide (AAAA-MM-JJ)'
    if (s.monthlyBilled != null && (!Number.isFinite(s.monthlyBilled) || s.monthlyBilled < 0 || s.monthlyBilled > 1_000_000)) err[`${s.id}.monthlyBilled`] = 'Montant invalide'
  }
  return err
}

export const euroFmt = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' })
export const pctFmt = (r: number) => `${(r * 100).toFixed(1).replace('.', ',')} %`
