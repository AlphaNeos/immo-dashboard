This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Mon Coach (`/coach`)

App perso de routine (sommeil progressif, eau, protéines, pas, sport, compléments, poids, bilan du soir). Données **uniquement dans le navigateur** (localStorage), aucun serveur.

- PC : `npm run dev` puis http://localhost:3000/coach
- Téléphone (même Wi-Fi) : `npm run coach`, puis ouvrir `http://<IP-du-PC>:3000/coach` et « Ajouter à l'écran d'accueil ».
- Sauvegarde : carte « Sauvegarde » en bas de page (export / import `.json`).
- Pas automatiques : un raccourci du téléphone peut ouvrir `/coach?steps=4200`.
- Le « jour » change à 06:00 (pas à minuit). Code : `app/coach/logic.ts` (règles) et `app/coach/page.tsx` (écran).

### Hébergement + synchro (une fois pour toutes)

1. **Supabase** (le même projet que le dashboard immo convient) :
   - *SQL Editor* → coller `supabase/coach_state.sql` → **Run** (table privée, protégée par RLS).
   - *Authentication → Providers* : « Email » activé.
   - *Authentication → URL Configuration* : **Site URL** = l'adresse Vercel (ex. `https://xxx.vercel.app`) et ajouter `https://xxx.vercel.app/coach` aux **Redirect URLs**.
   - *(Optionnel, pour recevoir un code à 6 chiffres)* *Authentication → Email Templates → Magic Link* : ajouter `{{ .Token }}` dans le texte.
2. **Vercel** : *Add New → Project* → ce dépôt (branche de production = celle qui contient `/coach`) → variables d'environnement :
   `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API) → **Deploy**.
3. Ouvrir `https://xxx.vercel.app/coach` sur PC **et** téléphone → carte « ☁️ Synchro » → e-mail → lien de connexion. Les deux appareils se fusionnent (le plus récent gagne, jour par jour).
4. Téléphone : « Ajouter à l'écran d'accueil », puis carte « 🔔 Rappels » → exporter les rappels `.ics` vers l'agenda.

Sans ces variables, l'app fonctionne en local uniquement (carte « Synchro » = non activée).
