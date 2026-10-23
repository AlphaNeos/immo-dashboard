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
| `npm test` | lance les tests automatiques |
| `npm run typecheck` | vérifie le code TypeScript |
| `npm run package:mac` | crée l'application Mac (.dmg) |

## Commandes dans la ville
| Action | Contrôle |
|---|---|
| Déplacer | glisser à la souris, ou WASD / flèches |
| Zoom | molette, pincement trackpad, ou touches + / - |
| Tourner (quart de tour fluide) | Q / E ou boutons ⟲ ⟳ |
| Tourner librement | Maj + glisser, ou clic droit + glisser |
| Recentrer | R ou bouton ⌂ |
| Statistiques de rendu | F3 |
| Vitrine des 6 modèles de bâtiments | F4 |
| Animations ON / OFF | bouton « Animations » ou touche P |
| Heure de la journée (jour / nuit) | curseur en bas à droite |

## Architecture
- `src/main/` : processus principal Electron (fenêtre, système)
- `src/preload/` : pont sécurisé interface <-> système
- `src/renderer/src/app/` : racine de l'interface
- `src/renderer/src/features/` : écrans (accueil...)
- `src/renderer/src/scene/` : briques 3D (R3F/Drei)
- `src/renderer/src/modules/city/` : la ville 3D (`layout.ts` = plan de la ville, `CityWorld.tsx` = objets 3D, `CameraRig.tsx` = caméra)
- `src/renderer/src/modules/housing/` : bâtiments (`types.ts` = modèle de données, `buildings.ts` = liste et contrôles, `models/` = les 6 modèles 3D)
- `src/renderer/src/modules/life/` : ville vivante (`traffic.ts` circulation, `pedestrians.ts` piétons, `lighting.ts` jour/nuit, `Decor.tsx` fontaine/fumée/oiseaux)
- `src/renderer/src/modules/` : futures fonctionnalités (ville, logements, finances...)
- `src/renderer/src/core/` : types et utilitaires partagés
