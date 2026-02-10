# Wonder Team - Propositions d'Evolution (Phase 3 - Mise a jour)

**Date** : 2026-02-09 (Session 3)
**Auteur** : Equipe Wonder-Team-Ops

---

## Statut des propositions precedentes

| # | Proposition | Statut |
|---|---|---|
| 1 | Securiser la cle Gemini | **FAIT** (cle retiree du build). Reste : revoquer dans Google Cloud Console |
| 2 | Bundling local, fin CDN | **FAIT** (CDN Tailwind + importmap supprimes, CSP durcie sans unsafe-eval) |
| 3A | Dashboard dynamique | A faire |
| 3B | Paiement reel | A faire |

---

## Nouvelles propositions prioritaires

## Proposition 1 : SECURITE - Corriger Google OAuth

### Constat
Google OAuth echoue systematiquement avec "Unable to exchange external code" (visible dans les logs Nginx). Les utilisateurs sont rediriges vers Google, mais le retour echoue. Cela bloque completement l'authentification reelle — les utilisateurs ne peuvent acceder qu'au mode mock/demo.

### Cause probable
- Redirect URI mal configure dans Google Cloud Console (doit etre `https://kkkycawqnapjlhohojjl.supabase.co/auth/v1/callback`)
- Ou Client Secret expire/invalide dans Supabase Dashboard
- Ou projet Google Cloud avec OAuth consent screen en mode "Testing" (limite a des emails specifiques)

### Solution recommandee
1. Verifier dans **Supabase Dashboard** → Authentication → Providers → Google : Client ID et Client Secret presents
2. Verifier dans **Google Cloud Console** → APIs → Credentials → OAuth 2.0 Client ID :
   - Authorized redirect URI = `https://kkkycawqnapjlhohojjl.supabase.co/auth/v1/callback`
   - OAuth consent screen publié (pas en mode "Testing")
3. Tester le flux complet apres correction

### Effort estime : 30 min (config uniquement, aucun code)
### Priorite : **CRITIQUE** — bloque toute utilisation reelle de l'app

---

## Proposition 2 : PERFORMANCE - Code splitting avec React.lazy

### Constat
Le bundle JS fait 835 KB (227 KB gzip) en un seul chunk. Toutes les pages (Dashboard, POS, Finance, Clients, Stock, Orders, Profile, Catalog) sont chargees au demarrage, meme si l'utilisateur ne visite qu'une seule page.

Le CDN Tailwind et l'importmap ont ete supprimes (Session 3), mais le bundle reste monolithique.

### Solution recommandee
1. Convertir chaque page en `React.lazy()` import :
   ```tsx
   const Dashboard = React.lazy(() => import('./pages/Dashboard'));
   const POS = React.lazy(() => import('./pages/POS'));
   // etc.
   ```
2. Wrapper dans `<Suspense fallback={<LoadingSpinner />}>` dans App.tsx
3. Vite decoupera automatiquement en chunks separes
4. Resultat attendu : bundle initial ~200-300 KB, pages chargees a la demande

### Impact attendu
- First Contentful Paint : -50% (seule la page Login chargee au depart)
- Chaque page subsequente : chargee en <100ms (deja en cache navigateur apres la premiere visite)

### Effort estime : 2-3h
### Priorite : **HAUTE**

---

## Proposition 3 : FEATURE - Dashboard dynamique avec donnees reelles

### Constat
Le Dashboard affiche actuellement :
- Graphique "Ventes par jour" : valeurs codees en dur (`Lun: 120, Mar: 200...`)
- Graphique "Repartition" : valeurs fixes (70% Parfums, 30% Soins)
- "Commandes recentes" : deux lignes HTML statiques
- Tendance "+12%" : affichee en dur

### Solution recommandee

**Phase A — Dashboard dynamique**
1. Calculer ventes par jour depuis `orders` (GROUP BY date)
2. Repartition par categorie depuis `orders.items` JSONB (join avec `products.category`)
3. Afficher les 5 dernieres commandes reelles (join `orders` + `clients.full_name`)
4. Calculer tendance : comparaison semaine courante vs precedente
5. Ajouter un compteur de stock critique (produits sous `alert_threshold`)

**Phase B — Integration IA Gemini (futur)**
1. Creer une Supabase Edge Function proxy pour Gemini API (cle cote serveur uniquement)
2. Activer les recommandations produits personnalisees par client
3. Generer des arguments de vente contextuels pour le POS

### Effort estime
- Phase A : 4-6h
- Phase B : 3-4h (Edge Function) + 2h (integration frontend)

### Priorite : **MOYENNE**

---

## Resume des priorites actualisees

| # | Proposition | Priorite | Effort | Impact | Prerequis |
|---|---|---|---|---|---|
| 1 | Corriger Google OAuth | CRITIQUE | 30 min | Auth reelle | Acces Google Cloud Console + Supabase Dashboard |
| 2 | Code splitting React.lazy | HAUTE | 2-3h | Performance -50% FCP | Aucun |
| 3A | Dashboard dynamique | MOYENNE | 4-6h | UX / Valeur metier | Donnees reelles dans Supabase |
| 3B | Gemini via Edge Function | BASSE | 5-6h | IA / Vente | Nouvelle cle Gemini + compte Supabase Pro (Edge Functions) |

### Action immediate recommandee
> 1. **Revoquer les cles Gemini** dans Google Cloud Console (5 min)
> 2. **Corriger Google OAuth** dans Supabase + Google Cloud Console (30 min)
> 3. Ces deux actions ne necessitent aucun changement de code
