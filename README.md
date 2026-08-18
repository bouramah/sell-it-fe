# KFSTORE — Back-office web

Interface web (React + TypeScript + Vite) pour le personnel de GROUPE SKF SARL : gestion du
réseau de boutiques, stock, caisse, commandes, clients, sécurité, IA... Consomme l'API du
backend (`../backend`).

Production : https://admin.kfstore-gn.com

## Démarrage

1. **Prérequis** : Node.js 18+.

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer l'API cible** — `.env.development.local` (déjà présent en dev) ou `.env.local`
   à créer, en s'inspirant de `.env.example` :
   ```bash
   VITE_SERVER_BASE=http://localhost:8000
   ```
   Pointer vers le backend local (voir `../backend/README.md` pour le lancer) ou vers la prod.

4. **Lancer le serveur de dev** :
   ```bash
   npm run dev
   ```
   Disponible sur http://localhost:5173.

## Autres commandes

```bash
npm run build     # tsc -b (vérification stricte des types) + build de production dans dist/
npm run preview   # sert le build de production en local
npm run lint       # oxlint
```

⚠️ `npm run build` (via `tsc -b`, incrémental) est plus strict que `tsc --noEmit` seul et peut
détecter des erreurs invisibles avec un cache incrémental périmé. En cas de doute :
```bash
rm -rf node_modules/.tmp dist && npx tsc -b
```

## Structure

- `src/api/client.ts` — client HTTP unique (fetch), auth par Bearer token, un objet `api` avec
  une méthode par endpoint.
- `src/pages/` — une page par écran, routées dans `src/App.tsx`.
- `src/components/` — composants réutilisables (tableaux, badges, sélecteurs...).
- `src/lib/` — contextes (auth), matrice de droits (`permissions.ts`), navigation
  (`navSections.ts`, source unique pour le menu latéral et les redirections par rôle), hooks
  utilitaires (pagination, recherche, debounce...).
- `src/types/index.ts` — types TypeScript miroir des schémas Pydantic du backend.

## Déploiement (production)

Sur le VPS : `git pull && npm run build`, puis `rsync -a --delete dist/ /var/www/kfstore/web/`.
Nginx sert les fichiers statiques et proxy `/api` + `/uploads` vers le backend sur la même
origine (voir `VITE_SERVER_BASE` vide en prod).
