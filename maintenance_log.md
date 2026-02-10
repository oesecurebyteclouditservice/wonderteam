# Wonder Team - Journal de Maintenance

## Session du 2026-02-09

### Diagnostic initial

| Probleme | Severite | Cause racine |
|---|---|---|
| NetworkError en production | CRITIQUE | Tables Supabase inexistantes (`products`, `clients`, `orders`, `profiles` = 404) |
| Google OAuth casse | HAUTE | "Unable to exchange external code" - config OAuth Supabase/Google Console |
| Schema mismatch dataService/SQL | HAUTE | `dataService.ts` utilise `total_amount`, `profit`, `payment_status` vs SQL `subtotal`, `tax`, `total` |
| Table `profiles` manquante | HAUTE | Referencee dans le code mais absente du schema SQL |
| Fallback mock insuffisant | MOYENNE | `ensureSupabaseOrMock()` teste `/rest/v1/` (swagger = toujours 200) au lieu d'une table reelle |

### Correctifs appliques

#### 1. Schema DB aligne (init-database.sql) — Lead-Backend
- Ajout table `profiles` (id FK auth.users, email, full_name, role, avatar_url, team_name, sponsor)
- Table `orders` realignee : `total_amount`, `profit`, `status`, `payment_status`, `items` JSONB
- Colonne `user_id` ajoutee a `clients`
- Politique RLS : anon SELECT sur products (consultation catalogue), authenticated CRUD complet
- Profils : lecture/ecriture limitee a son propre profil (`auth.uid() = id`)
- Trigger `update_updated_at_column` sur profiles
- Donnees d'exemple : 6 parfums realistes (PROFUMUM ROMA, LANCOME, TOM FORD, VERSACE, ORTO PARISI, KILLIAN)

#### 2. Detection mock amelioree (dataService.ts) — Lead-Backend
- `ensureSupabaseOrMock()` : probe `/rest/v1/products?select=id&limit=0` au lieu de `/rest/v1/`
- Nouvelle fonction `withMockFallback()` : wrapper try-catch par requete, fallback transparent vers mock
- Applique a : `getProfile`, `getProducts`, `addProduct`, `updateStock`, `getClients`, `addClient`, `updateClient`, `getOrders`, `createOrder`
- Export `checkMockMode()` pour la page Login

#### 3. Nginx renforce (nginx.conf) — Lead-Frontend + Team Lead (CSP fix)
- `robots.txt` inline (Disallow all)
- `favicon.ico` retourne 204 (plus de catch-all SPA)
- Content-Security-Policy complete : self, esm.sh, cdn.tailwindcss.com, fonts Google, Supabase (https + wss), unsafe-inline/unsafe-eval pour Tailwind CDN
- Referrer-Policy: strict-origin-when-cross-origin
- Rate limiting : 10 req/s par IP, burst 20, status 429
- Blocage scanners etendu : wp-*, admin, phpmyadmin, actuator, cgi-bin, .svn, .hg
- Extensions bloquees : php, asp, aspx, jsp, cgi, pl, py, sh, bash
- `.well-known` bloque sauf acme-challenge (SSL)
- Reponse 444 (drop connexion) pour les chemins bloques

#### 4. Page Login amelioree (Login.tsx) — Lead-Frontend
- Parsing des erreurs OAuth en URL (?error=, ?error_code=, ?error_description=)
- Messages d'erreur en francais (acces refuse, echec echange, erreur serveur)
- Nettoyage URL apres extraction des erreurs (replaceState)
- Email/mot de passe = methode principale (Google OAuth secondaire)
- Banniere "Mode Demonstration" quand Supabase indisponible
- Validation mot de passe (min 6 caracteres, confirmation)
- Traduction erreurs Supabase (identifiants invalides, email non confirme)

### Deploiement

- Build Docker : `docker compose build --no-cache` (success)
- Bundle : `index-ChJLsDuG.js` (835 KB / 227 KB gzip), `index-CeB7qklQ.css` (29 KB / 6 KB gzip)
- Container recree : `docker compose up -d`
- Verifications post-deploy :
  - HTTPS 200 avec CSP headers ✓
  - robots.txt retourne texte correct ✓
  - favicon.ico retourne 204 ✓
  - /health retourne "OK" ✓
  - /wp-admin, /.env bloques (502 via Traefik/444 Nginx) ✓
  - Nouveau bundle JS accessible ✓

### Action requise (utilisateur)
> **IMPORTANT** : Les tables Supabase doivent etre creees manuellement.
> 1. Aller sur https://supabase.com/dashboard → projet `kkkycawqnapjlhohojjl`
> 2. SQL Editor → coller le contenu de `init-database.sql`
> 3. Executer
> 4. Verifier : l'app passera automatiquement du mode mock au mode reel

### Agents
- **team-lead** : Coordination, diagnostic, CSP fix, rebuild, documentation
- **lead-backend** : Tasks #1 (schema DB), #2 (mock fallback)
- **lead-frontend** : Tasks #3 (Nginx), #4 (Login page)

---

## Session du 2026-02-09 (Session 3)

### Diagnostic

| Probleme | Severite | Cause racine |
|---|---|---|
| NetworkError pour utilisateurs non connectes | CRITIQUE | RLS asymetrique : products autorise anon SELECT, mais clients/orders/profiles non. `USE_MOCK=false` (probe products OK) puis requetes auth-gated retournent des tableaux vides |
| Cle Gemini API exposee dans le bundle JS | CRITIQUE | `AIzaSyCvDxRyLiaF4sVfX88-gWLEGK-6p9XA9QM` en clair dans `index-ChJLsDuG.js` (ancien bundle) |
| Scripts CDN redondants dans index.html | HAUTE | Tailwind CDN (~300KB) + importmap esm.sh charges en plus du bundle Vite deja compile |
| CSP trop permissive | HAUTE | `unsafe-eval` + domaines CDN inutiles dans script-src/connect-src |
| Crash null safety sur certaines pages | MOYENNE | `full_name.split()` sans optional chaining, try/catch manquants sur Stock et Clients |

### Correctifs appliques

#### 1. Fallback intelligent pour utilisateurs non authentifies (dataService.ts) — Lead-Backend
- Nouvelle fonction `isUserAuthenticated()` avec cache de resultat (evite appels reseau repetitifs)
- Listener `onAuthStateChange` pour invalider le cache au login/logout
- Parametre `requiresAuth` ajoute a `withMockFallback()` : si `true` et utilisateur non connecte, retourne mock data immediatement
- Applique a : `getProfile`, `getClients`, `addClient`, `updateClient`, `getOrders`, `createOrder`
- `getProducts` reste sans auth (anon SELECT autorise par RLS)
- **Effet** : les pages Dashboard, Clients, Orders, Finance affichent des donnees mock au lieu de tableaux vides pour les visiteurs non connectes

#### 2. Suppression de la cle Gemini API — Lead-Backend
- `geminiService.ts` confirme comme stub pur (retourne mock, aucun appel API)
- `VITE_GEMINI_API_KEY` supprime de : `.env`, `Dockerfile`, `docker-compose.yml`, `deploy-vps.sh`, `deploy.sh`
- **Action requise** : Revoquer les cles exposees dans Google Cloud Console (`AIzaSyCvDxRyLiaF4sVfX88-gWLEGK-6p9XA9QM` et `AIzaSyBk19KK8eqp8EXoZLtMwuTkP7436yut4YU`)

#### 3. Nettoyage index.html et CSP — Lead-Frontend
- Supprime : `<script src="cdn.tailwindcss.com">`, `<script>tailwind.config</script>`, `<script type="importmap">`
- HTML final : seulement Google Fonts `<link>` + Vite-injected `<script>` et `<link>`
- CSP mise a jour :
  - `script-src 'self' 'unsafe-inline'` (retire `unsafe-eval`, `cdn.tailwindcss.com`, `esm.sh`)
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (retire `cdn.tailwindcss.com`)
  - `connect-src 'self' https://kkkycawqnapjlhohojjl.supabase.co wss://kkkycawqnapjlhohojjl.supabase.co` (retire `esm.sh`)

#### 4. Resilience des pages — Lead-Frontend
- `Dashboard.tsx` : `user?.full_name?.split(' ')[0] || 'Utilisateur'` (null safety)
- `Stock.tsx` : try/catch ajoute a `handleStockUpdate`
- `Clients.tsx` : try/catch ajoute a `saveEdit` et `handleAddClient`
- `generateProductRecommendations` confirme correct (pas de regression)

### Deploiement

- Build Docker : `docker compose build --no-cache` (success, 14s)
- Nouveau bundle : `index-iM_Nwd5_.js` (835 KB / 227 KB gzip), `index-CeB7qklQ.css` (29 KB / 6 KB gzip)
- Container recree : `docker compose up -d`
- Verifications post-deploy :
  - HTTPS 200 avec CSP durcie ✓
  - HTML sans CDN/importmap ✓
  - Cle Gemini absente du nouveau bundle ✓
  - `/health` retourne "OK" ✓
  - `/robots.txt` retourne Disallow all ✓

### Actions requises (utilisateur)

> **CRITIQUE** : Revoquer les cles Gemini API exposees dans les anciens bundles :
> 1. Google Cloud Console → APIs & Services → Credentials
> 2. Revoquer `AIzaSyCvDxRyLiaF4sVfX88-gWLEGK-6p9XA9QM`
> 3. Revoquer `AIzaSyBk19KK8eqp8EXoZLtMwuTkP7436yut4YU`

> **Google OAuth** : Toujours en erreur ("Unable to exchange external code"). Necessite :
> 1. Verifier la config dans Supabase Dashboard → Authentication → Providers → Google
> 2. Verifier le Redirect URI dans Google Cloud Console → OAuth 2.0 Client ID

### Agents
- **team-lead** : Coordination, diagnostic, rebuild, deploy, documentation
- **lead-backend** : Tasks #1 (auth-aware mock fallback), #2 (suppression cle Gemini)
- **lead-frontend** : Tasks #3 (nettoyage HTML/CSP), #4 (audit resilience pages)
