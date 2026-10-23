# Modules futurs

Chaque grande fonctionnalité aura son dossier ici, indépendant des autres :

- `city/`     — la ville 3D (grille, caméra, quartiers)
- `housing/`  — les logements / bâtiments (un bâtiment = un vrai logement)
- `finance/`  — loyers, charges, rentabilité
- `data/`     — import/stockage local des données (fichiers, base locale)
- `ui/`       — composants d'interface partagés (HUD, panneaux)

Règle : un module ne dépend pas d'un autre module directement ; ils
communiquent via `core/` (types et utilitaires communs).
