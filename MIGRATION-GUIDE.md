# Guide de Migration - Wonder Team Stock System

## Vue d'ensemble

Cette migration met à jour votre système Wonder Team avec les améliorations suivantes:

### ✅ Priorité 1 - Google OAuth
- Connexion Google ajoutée à la page de login
- Configuration Supabase requise

### ✅ Priorités 2-5 - Nouveau Système de Stock
- Structure de table Products mise à jour pour correspondre au CSV
- Support multi-tailles (15ml, 30ml, 70ml)
- Prix et stocks par taille
- Import CSV complet

---

## Étape 1: Configuration Google OAuth sur Supabase

### 1.1 Accéder à la Console Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet: `kkkycawqnapjlhohojjl`

### 1.2 Configurer Google OAuth
1. Dans le menu gauche, allez à **Authentication** > **Providers**
2. Trouvez **Google** dans la liste des providers
3. Activez Google OAuth
4. Entrez vos credentials:
   - **Client ID**: `57773763920-r9jkq2jeun0q4ubhr3smk7cbltu7c9m6.apps.googleusercontent.com`
   - **Client Secret**: `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`
5. Dans "Authorized redirect URIs", ajoutez:
   ```
   https://kkkycawqnapjlhohojjl.supabase.co/auth/v1/callback
   ```
6. Cliquez sur **Save**

### 1.3 Configuration Google Console (si nécessaire)
Si vous n'avez pas encore configuré votre projet Google:
1. Allez sur https://console.cloud.google.com/
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Vérifiez que l'URI de redirection Supabase est ajoutée:
   - `https://kkkycawqnapjlhohojjl.supabase.co/auth/v1/callback`

---

## Étape 2: Migration de la Base de Données

### 2.1 Sauvegarder vos Données Existantes (IMPORTANT)

**⚠️ ATTENTION**: Cette migration va recréer la table `products`. Sauvegardez vos données d'abord!

```sql
-- Créer une sauvegarde de la table products
CREATE TABLE products_backup AS SELECT * FROM public.products;
```

### 2.2 Exécuter la Migration de Structure

1. Allez dans **SQL Editor** sur Supabase
2. Ouvrez le fichier `migration-stock-structure.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **Run**

Cette migration va:
- Supprimer l'ancienne table products
- Créer la nouvelle structure avec support multi-tailles
- Recréer les indexes et triggers
- Mettre à jour les fonctions RPC

### 2.3 Importer les Données du CSV

1. Toujours dans **SQL Editor**
2. Ouvrez le fichier `import-products.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **Run**

Cela va importer tous les 136 produits du fichier `MonStock_all.csv`.

---

## Étape 3: Vérifier la Migration

### 3.1 Vérifier la Structure de la Table

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

Vous devriez voir:
- `name`, `brand`, `category`
- `cat_15ml`, `cat_30ml`, `cat_70ml` (références)
- `price_15ml`, `price_30ml`, `price_70ml` (prix)
- `stock_total`, `stock_15ml`, `stock_30ml`, `stock_70ml` (stocks)

### 3.2 Vérifier les Données

```sql
SELECT name, brand, price_15ml, price_30ml, price_70ml, stock_total
FROM products
LIMIT 10;
```

### 3.3 Tester les Policies RLS

```sql
-- Vérifier que les policies sont actives
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'products';
```

---

## Étape 4: Redémarrer l'Application

### 4.1 Vider le Cache du Navigateur
1. Ouvrez DevTools (F12)
2. Faites un clic droit sur le bouton refresh
3. Sélectionnez "Empty Cache and Hard Reload"

### 4.2 Tester Google OAuth
1. Déconnectez-vous si vous êtes connecté
2. Cliquez sur "Continuer avec Google"
3. Sélectionnez votre compte Google
4. Vérifiez que vous êtes connecté avec succès

### 4.3 Tester la Gestion du Stock
1. Allez sur la page **Stock**
2. Vérifiez que tous les produits sont affichés
3. Testez l'ajout/modification de stock pour chaque taille (15ml, 30ml, 70ml)
4. Déconnectez-vous et reconnectez-vous
5. **Vérifiez que les modifications sont persistées** ✅

---

## Nouvelle Structure de Données

### Product (Avant)
```typescript
{
  id: string;
  name: string;
  reference: string;
  price_public: number;
  price_cost: number;
  stock_quantity: number;
}
```

### Product (Après)
```typescript
{
  id: string;
  name: string;
  brand: string;
  category: string;

  // Références par taille
  cat_15ml?: string;
  cat_30ml?: string;
  cat_70ml?: string;

  // Prix par taille
  price_15ml: number;
  price_30ml: number;
  price_70ml: number;

  // Stock par taille
  stock_total: number;
  stock_15ml: number;
  stock_30ml: number;
  stock_70ml: number;
}
```

---

## Fonctionnalités Ajoutées

### 1. Google OAuth ✅
- Bouton "Continuer avec Google" sur la page de login
- Connexion simplifiée pour les utilisateurs

### 2. Gestion Multi-Tailles ✅
- Gérer 3 tailles différentes par produit (15ml, 30ml, 70ml)
- Prix différent par taille
- Stock séparé par taille
- Stock total calculé automatiquement

### 3. Import CSV Amélioré ✅
- Format CSV correspondant à `MonStock_all.csv`
- Import automatique avec parsing des prix (€)
- Gestion des colonnes multiples pour les tailles

### 4. Persistance Backend ✅
- Toutes les modifications sont sauvegardées en base de données
- Plus de perte de données à la déconnexion
- Synchronisation automatique avec Supabase

### 5. Interface Modernisée ✅
- Tableau avec colonnes par taille
- Contrôles +/- pour chaque taille
- Affichage des prix par taille
- Badge de stock total avec alerte visuelle

---

## Résolution des Problèmes

### Le stock ne se sauvegarde pas
1. Vérifiez la connexion Supabase dans la console du navigateur
2. Vérifiez que les RLS policies sont actives
3. Vérifiez que l'utilisateur est bien authentifié

### Google OAuth ne fonctionne pas
1. Vérifiez les credentials dans Supabase
2. Vérifiez l'URL de redirection
3. Vérifiez que Google OAuth est activé sur Google Console

### Les produits n'apparaissent pas
1. Vérifiez que la migration SQL a bien été exécutée
2. Vérifiez que l'import des produits est terminé
3. Videz le cache et rechargez la page

### Erreur "column does not exist"
La migration n'a pas été appliquée correctement. Relancez `migration-stock-structure.sql`.

---

## Support

Pour toute question ou problème:
1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs Supabase dans le dashboard
3. Consultez la documentation Supabase: https://supabase.com/docs

---

## Checklist Finale

- [ ] Google OAuth configuré sur Supabase
- [ ] Migration de structure exécutée (`migration-stock-structure.sql`)
- [ ] Données CSV importées (`import-products.sql`)
- [ ] Application redémarrée et cache vidé
- [ ] Test de connexion Google réussi
- [ ] Test d'ajout/modification de produit réussi
- [ ] Test de persistance après déconnexion/reconnexion réussi
- [ ] Import CSV testé

---

## Résumé des Fichiers

| Fichier | Description |
|---------|-------------|
| `migration-stock-structure.sql` | Migration de la structure de la table products |
| `import-products.sql` | Import des 136 produits du CSV |
| `import-csv-data.py` | Script Python pour générer les INSERT SQL |
| `pages/Stock.tsx` | Nouvelle interface de gestion du stock |
| `services/dataService.ts` | Service mis à jour avec Google OAuth |
| `types.ts` | Types TypeScript mis à jour |

---

🎉 **Migration Terminée!** Votre système Wonder Team est maintenant à jour avec Google OAuth et le nouveau système de gestion multi-tailles!
