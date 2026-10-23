#!/bin/bash
# Double-cliquez sur ce fichier pour lancer le jeu.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé. Installez-le depuis https://nodejs.org (version LTS) puis relancez."
  read -n 1 -s -r -p "Appuyez sur une touche pour fermer..."
  exit 1
fi
[ -d node_modules ] || npm install
npm run dev
