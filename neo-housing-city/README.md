# NEO HOUSING CITY

Jeu de simulation de gestion immobilière en 3D, 100 % local (aucun serveur requis).
Stack : Electron + React + TypeScript + Vite + Three.js / React Three Fiber / Drei.

## Première utilisation (Mac)
1. Installer Node.js (version LTS) depuis https://nodejs.org
2. Dans ce dossier, double-cliquer sur **Lancer NEO HOUSING CITY.command**
   (au premier lancement : clic droit > Ouvrir, puis confirmer).

## Commandes (Terminal)
| Commande | Effet |
|---|---|
| `npm install` | installe les dépendances (une seule fois) |
| `npm run dev` | lance l'app en mode développement |
| `npm run build` | compile l'app |
| `npm start` | lance la version compilée |
| `npm run typecheck` | vérifie le code TypeScript |
| `npm run package:mac` | crée l'application Mac (.dmg) |

## Architecture
- `src/main/` : processus principal Electron (fenêtre, système)
- `src/preload/` : pont sécurisé interface <-> système
- `src/renderer/src/app/` : racine de l'interface
- `src/renderer/src/features/` : écrans (accueil...)
- `src/renderer/src/scene/` : briques 3D (R3F/Drei)
- `src/renderer/src/modules/` : futures fonctionnalités (ville, logements, finances...)
- `src/renderer/src/core/` : types et utilitaires partagés
