import { euroFmt, pctFmt, portfolio } from '@/modules/housing/properties'
import { useProperties } from '@/modules/housing/propertyStore'

// Total mensuel des logements, recalculé à partir des fiches (donc toujours cohérent avec elles).
export function PortfolioBar() {
  const list = useProperties()
  const t = portfolio(list)
  return (
    <div className="portfolio" title={`Somme des ${list.length} logements, recalculée à partir de leurs fiches`}>
      <div><small>Facturé / mois</small><b>{euroFmt.format(t.billed)}</b></div>
      <div><small>Coûts / mois</small><b>{euroFmt.format(t.cost)}</b></div>
      <div><small>Marge brute</small><b className="portfolio__m">{euroFmt.format(t.margin)}</b><em>{pctFmt(t.rate)}</em></div>
      <div><small>Logements</small><b>{list.length}</b></div>
    </div>
  )
}
