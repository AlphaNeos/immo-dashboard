import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Bien = {
  id:                  string
  source:              string
  sources_vues:        string[]
  url:                 string
  titre:               string | null
  prix:                number | null
  prix_initial:        number | null
  surface:             number | null
  chambres:            number | null
  adresse:             string | null
  ville:               string | null
  code_postal:         string | null
  description:         string | null
  nb_photos:           number
  date_publication:    string | null
  date_detection:      string
  score_filtre:        number
  score_ia:            number | null
  statut:              string
  recommandation:      string | null
  analyse_ia:          Record<string, unknown> | null
  prix_marche:         number | null
  loyer_estime:        number | null
  budget_travaux:      number | null
  cout_total:          number | null
  jours_en_ligne:      number | null
  premiere_detection:  string | null
  derniere_vue:        string | null
  nb_remises_en_vente: number | null
}

export type HistoriquePrix = {
  id:         string
  bien_id:    string
  prix:       number
  date_check: string
}
