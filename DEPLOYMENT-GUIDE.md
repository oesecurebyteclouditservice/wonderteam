# 🚀 Guide de Déploiement - Correction Persistance des Données

Ce guide explique comment déployer la correction critique qui garantit la persistance des données entre les sessions utilisateur.

---

## 🔍 Problèmes Corrigés

### ✅ Avant la correction
- ❌ Les produits étaient partagés entre tous les utilisateurs
- ❌ Import CSV créait des produits orphelins
- ❌ Déconnexion = perte apparente des données
- ❌ Connexion Google OAuth ne créait pas de profil correctement

### ✅ Après la correction
- ✅ Chaque utilisateur a ses propres produits, clients et commandes
- ✅ Import CSV lie automatiquement les produits à l'utilisateur connecté
- ✅ Les données persistent entre les sessions (déconnexion/reconnexion)
- ✅ Google OAuth crée automatiquement un profil utilisateur

---

## 📋 Prérequis

1. **Accès Supabase**
   - URL de votre projet Supabase
   - Clé de service (Service Role Key)

2. **Outils Nécessaires**
   - Node.js et npm installés
   - Supabase CLI (recommandé) : `npm install -g supabase`
   - OU accès à la console Supabase SQL Editor

3. **Sauvegarde**
   - ⚠️ **IMPORTANT** : Sauvegardez votre base de données avant de continuer
   - Utilisez le backup SQL fourni : `backup-products.sql`

---

## 🛠️ Méthode 1 : Déploiement via Supabase CLI (Recommandé)

### Étape 1 : Installer Supabase CLI

```bash
npm install -g supabase
```

### Étape 2 : Se connecter à votre projet

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### Étape 3 : Exécuter la migration

```bash
# Rendre le script exécutable
chmod +x deploy-migration.sh

# Définir les variables d'environnement
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_SERVICE_KEY='your-service-role-key'

# Exécuter la migration
./deploy-migration.sh
```

### Étape 4 : Vérifier la migration

```bash
supabase db execute < test-data-persistence.sql
```

---

## 🛠️ Méthode 2 : Déploiement via Console Web Supabase

### Étape 1 : Ouvrir SQL Editor

1. Connectez-vous à https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (icône de base de données)

### Étape 2 : Exécuter la migration

1. Créez une nouvelle requête
2. Copiez le contenu de `migration-add-user-id.sql`
3. Collez dans l'éditeur SQL
4. Cliquez sur **Run** (ou `Ctrl+Enter`)

### Étape 3 : Vérifier la migration

1. Créez une nouvelle requête
2. Copiez le contenu de `test-data-persistence.sql`
3. Exécutez et vérifiez les résultats

---

## 🧪 Tests Post-Déploiement

### Test 1 : Vérification des colonnes

```sql
-- Vérifier que user_id existe dans products
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'user_id';

-- Vérifier que user_id existe dans orders
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'user_id';
```

### Test 2 : Vérification des RLS Policies

```sql
-- Lister toutes les policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('products', 'clients', 'orders')
ORDER BY tablename;
```

### Test 3 : Test Fonctionnel (Frontend)

1. **Créer un compte utilisateur A**
   - S'inscrire avec email/password
   - Ajouter 3 produits manuellement
   - Importer un CSV avec 5 produits
   - Total : 8 produits

2. **Se déconnecter et créer un compte utilisateur B**
   - S'inscrire avec un autre email
   - Vérifier que l'utilisateur B voit 0 produits ✅
   - Ajouter 2 produits

3. **Se reconnecter avec l'utilisateur A**
   - Vérifier que les 8 produits sont toujours là ✅
   - Ajouter 1 client, créer 1 commande
   - Se déconnecter

4. **Se reconnecter avec l'utilisateur A**
   - Vérifier que tout est intact : 8 produits, 1 client, 1 commande ✅

5. **Test Google OAuth**
   - Se connecter avec Google
   - Vérifier qu'un profil est créé automatiquement
   - Ajouter des produits
   - Se déconnecter et se reconnecter avec Google
   - Vérifier que les données persistent ✅

---

## 🐛 Dépannage

### Problème : "Column user_id does not exist"

**Solution** : La migration n'a pas été appliquée correctement.
```sql
-- Vérifier si la colonne existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'user_id';

-- Si elle n'existe pas, exécuter manuellement :
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

### Problème : "new row violates row-level security policy"

**Solution** : Les anciennes policies n'ont pas été supprimées.
```sql
-- Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON public.products;
-- ... etc

-- Puis réexécuter la section des policies de la migration
```

### Problème : Les produits existants ne sont pas visibles

**Solution** : Les produits existants n'ont pas été assignés à un utilisateur.
```sql
-- Assigner tous les produits orphelins à votre utilisateur
UPDATE public.products
SET user_id = 'YOUR_USER_ID'
WHERE user_id IS NULL;

-- Trouver votre USER_ID :
SELECT id, email FROM auth.users;
```

### Problème : Google OAuth ne crée pas de profil

**Solution** : Vérifier que le trigger `handle_new_user` existe.
```sql
-- Vérifier le trigger
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Si absent, recréer le trigger (contenu dans init-database.sql, lignes 554-569)
```

---

## 📊 Monitoring Post-Migration

### Requêtes Utiles

```sql
-- Nombre d'utilisateurs
SELECT COUNT(*) FROM auth.users;

-- Distribution des produits par utilisateur
SELECT u.email, COUNT(p.id) as product_count
FROM auth.users u
LEFT JOIN public.products p ON u.id = p.user_id
GROUP BY u.email
ORDER BY product_count DESC;

-- Distribution des clients par utilisateur
SELECT u.email, COUNT(c.id) as client_count
FROM auth.users u
LEFT JOIN public.clients c ON u.id = c.user_id
GROUP BY u.email
ORDER BY client_count DESC;

-- Vérifier qu'il n'y a pas de données orphelines
SELECT
  (SELECT COUNT(*) FROM public.products WHERE user_id IS NULL) as orphaned_products,
  (SELECT COUNT(*) FROM public.clients WHERE user_id IS NULL) as orphaned_clients,
  (SELECT COUNT(*) FROM public.orders WHERE user_id IS NULL) as orphaned_orders;
```

---

## ✅ Checklist de Validation

Avant de considérer la migration comme réussie, vérifiez :

- [ ] Les colonnes `user_id` existent dans `products` et `orders`
- [ ] Toutes les anciennes RLS policies ont été supprimées
- [ ] Les nouvelles RLS policies filtrent correctement par `user_id`
- [ ] Les RPC functions (`get_dashboard_stats`, etc.) filtrent par utilisateur
- [ ] Aucune donnée orpheline (user_id NULL)
- [ ] Test fonctionnel : Un utilisateur ne voit que ses données
- [ ] Test fonctionnel : Les données persistent après déconnexion
- [ ] Test Google OAuth : Profil créé automatiquement
- [ ] Import CSV : Produits liés à l'utilisateur connecté

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Supabase : Dashboard > Logs
2. Consultez les erreurs de la console navigateur (F12)
3. Exécutez `test-data-persistence.sql` pour diagnostiquer
4. Vérifiez que toutes les étapes ont été suivies dans l'ordre

---

## 🔄 Rollback (En cas de problème)

Si la migration cause des problèmes, vous pouvez revenir en arrière :

```sql
-- ATTENTION : Ceci supprime les colonnes user_id et restaure les anciennes policies

-- 1. Supprimer les nouvelles policies
DROP POLICY IF EXISTS "Users can read own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
-- ... répéter pour clients, orders, etc.

-- 2. Recréer les anciennes policies (voir init-database.sql)
CREATE POLICY "Allow authenticated users to read products"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);
-- ... etc.

-- 3. Supprimer les colonnes user_id (⚠️ PERTE DE DONNÉES)
ALTER TABLE public.products DROP COLUMN user_id;
ALTER TABLE public.orders DROP COLUMN user_id;
```

**⚠️ ATTENTION** : Le rollback supprimera la liaison entre les données et les utilisateurs. Ne l'utilisez qu'en dernier recours.

---

## 📝 Notes Importantes

- Cette migration est **CRITIQUE** pour la persistance des données
- Une fois déployée, tous les nouveaux produits/clients/commandes seront automatiquement liés à l'utilisateur qui les crée
- Les utilisateurs ne verront QUE leurs propres données (isolation complète)
- L'import CSV fonctionne désormais correctement et lie les produits à l'utilisateur
- Google OAuth crée automatiquement un profil utilisateur au premier login

---

**Date de création** : 2026-02-12
**Version** : 1.0
**Auteur** : Wonder Team - Claude Sonnet 4.5
