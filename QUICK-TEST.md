# 🧪 Test Rapide de Validation - Persistance des Données

Ce guide vous permet de tester rapidement que la correction fonctionne correctement.

---

## ⏱️ Test Rapide (5 minutes)

### Prérequis
- Migration SQL exécutée (`migration-add-user-id.sql`)
- Application redémarrée (`npm run dev`)

---

## 🎯 Scénario de Test 1 : Persistance Basique

### Étape 1 : Créer un compte utilisateur
1. Ouvrez l'application : http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire :
   - Nom : `Test User 1`
   - Email : `test1@example.com`
   - Mot de passe : `password123`
4. Cliquez sur "Créer mon compte"
5. ✅ **Vérification** : Vous devez être connecté et voir le Dashboard

### Étape 2 : Ajouter des produits manuellement
1. Allez dans **Stock**
2. Cliquez sur "Ajouter un produit"
3. Remplissez :
   - Nom : `Test Parfum 1`
   - Marque : `Test Brand`
   - Catégorie : `FEMME`
   - Prix 30ml : `50`
   - Stock 30ml : `10`
4. Cliquez "Ajouter"
5. ✅ **Vérification** : Le produit apparaît dans la liste

### Étape 3 : Importer un CSV
1. Créez un fichier `test-import.csv` :
```csv
NOM;CATEGORIE;CAT_15ML;CAT_30ML;CAT_70ML;MARQUE;PX_15ML;PX_30ML;PX_70ML;STOCK TOTAL;STOCK_15ML;STOCK_30ML;STOCK_70ML
Test CSV Product;HOMME;REF1;REF2;REF3;CSV Brand;15;30;60;50;10;20;20
```
2. Dans **Stock**, cliquez "Importer CSV"
3. Sélectionnez `test-import.csv`
4. ✅ **Vérification** : Le produit CSV apparaît dans la liste
5. ✅ **Total attendu** : 2 produits visibles

### Étape 4 : Se déconnecter
1. Cliquez sur "Se déconnecter" (sidebar ou menu mobile)
2. ✅ **Vérification** : Retour à l'écran de connexion

### Étape 5 : Se reconnecter
1. Connectez-vous avec :
   - Email : `test1@example.com`
   - Mot de passe : `password123`
2. Allez dans **Stock**
3. ✅ **CRITIQUE** : Vérifiez que vous voyez toujours **2 produits**
   - ✅ Test Parfum 1
   - ✅ Test CSV Product

**🎉 Si vous voyez les 2 produits : La persistance fonctionne !**

---

## 🔒 Scénario de Test 2 : Isolation des Données

### Étape 1 : Se déconnecter du compte test1
1. Déconnectez-vous de `test1@example.com`

### Étape 2 : Créer un 2ème compte
1. Cliquez "S'inscrire"
2. Remplissez :
   - Nom : `Test User 2`
   - Email : `test2@example.com`
   - Mot de passe : `password123`
3. Connectez-vous

### Étape 3 : Vérifier l'isolation
1. Allez dans **Stock**
2. ✅ **CRITIQUE** : Vérifiez que vous voyez **0 produits**
   - Vous ne devez PAS voir les produits de test1@example.com
3. Ajoutez un produit :
   - Nom : `Product User 2`
   - Prix 30ml : `40`
   - Stock 30ml : `5`
4. ✅ **Vérification** : Vous voyez 1 seul produit (le vôtre)

### Étape 4 : Retour au compte test1
1. Déconnectez-vous de test2@example.com
2. Reconnectez-vous avec test1@example.com
3. Allez dans **Stock**
4. ✅ **CRITIQUE** : Vérifiez que vous voyez **2 produits** (pas 3 !)
   - ✅ Test Parfum 1
   - ✅ Test CSV Product
   - ❌ Product User 2 (NE DOIT PAS APPARAÎTRE)

**🎉 Si vous voyez uniquement vos 2 produits : L'isolation fonctionne !**

---

## 🔐 Scénario de Test 3 : Google OAuth

### Étape 1 : Connexion Google
1. Déconnectez-vous de tout compte
2. Sur l'écran de connexion, cliquez "Continuer avec Google"
3. Autorisez l'accès avec votre compte Google
4. ✅ **Vérification** : Vous êtes connecté automatiquement

### Étape 2 : Profil créé automatiquement
1. Allez dans **Mon Espace** (Profile)
2. ✅ **Vérification** : Votre nom et email Google sont affichés

### Étape 3 : Ajouter des données
1. Allez dans **Stock**
2. Ajoutez un produit :
   - Nom : `Google OAuth Product`
   - Prix 30ml : `60`
   - Stock 30ml : `8`

### Étape 4 : Déconnexion et reconnexion
1. Déconnectez-vous
2. Reconnectez-vous avec Google (même compte)
3. Allez dans **Stock**
4. ✅ **CRITIQUE** : Le produit "Google OAuth Product" est toujours là

**🎉 Si le produit persiste : Google OAuth fonctionne !**

---

## ✅ Checklist de Validation

Cochez chaque test réussi :

### Persistance des Données
- [ ] Un utilisateur peut ajouter des produits manuellement
- [ ] Un utilisateur peut importer des produits via CSV
- [ ] Les produits persistent après déconnexion/reconnexion
- [ ] Les clients persistent après déconnexion/reconnexion
- [ ] Les commandes persistent après déconnexion/reconnexion

### Isolation des Données
- [ ] Un nouvel utilisateur voit 0 produits au départ
- [ ] Un utilisateur ne voit PAS les produits d'un autre utilisateur
- [ ] Un utilisateur ne voit PAS les clients d'un autre utilisateur
- [ ] Un utilisateur ne voit PAS les commandes d'un autre utilisateur

### Google OAuth
- [ ] La connexion Google redirige correctement vers le Dashboard
- [ ] Un profil est créé automatiquement lors du 1er login Google
- [ ] Les données ajoutées par un utilisateur Google persistent
- [ ] Un message d'erreur s'affiche si OAuth échoue (pas de boucle infinie)

### Import CSV
- [ ] L'import CSV ajoute les produits à la base de données
- [ ] Les produits importés sont liés à l'utilisateur connecté
- [ ] Les produits importés persistent après déconnexion
- [ ] Les produits importés ne sont PAS visibles par d'autres utilisateurs

---

## 🐛 Que faire si un test échoue ?

### Problème : Les produits disparaissent après déconnexion
**Diagnostic** : La migration SQL n'a pas été appliquée correctement
**Solution** :
```sql
-- Vérifier que user_id existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'user_id';

-- Si vide, exécuter migration-add-user-id.sql
```

### Problème : Un utilisateur voit les produits d'un autre
**Diagnostic** : Les RLS policies ne filtrent pas correctement
**Solution** :
```sql
-- Vérifier les policies
SELECT policyname, cmd, qual FROM pg_policies
WHERE tablename = 'products';

-- Doit contenir : user_id = auth.uid()
```

### Problème : Google OAuth ne fonctionne pas
**Diagnostic** : Le trigger handle_new_user n'existe pas
**Solution** :
```sql
-- Vérifier le trigger
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Si absent, exécuter la section du trigger dans migration-add-user-id.sql
```

### Problème : Import CSV ne persiste pas
**Diagnostic** : dataService.addProduct() n'ajoute pas le user_id
**Solution** : Vérifier que `services/dataService.ts` a été mis à jour avec le nouveau code

---

## 📊 Résultats Attendus

| Test | Résultat Attendu |
|------|------------------|
| Ajout manuel produit | ✅ Visible immédiatement |
| Import CSV | ✅ Visible immédiatement |
| Déconnexion → Reconnexion | ✅ Toutes les données présentes |
| 2ème utilisateur créé | ✅ Voit 0 produits |
| Retour au 1er utilisateur | ✅ Voit uniquement ses produits |
| Google OAuth login | ✅ Profil créé, accès Dashboard |
| Google OAuth persistance | ✅ Données sauvegardées |

---

## 🎯 Score de Validation

**7/7 tests réussis** : 🎉 Parfait ! La correction est complète.
**5-6/7 tests réussis** : ⚠️ Presque bon, vérifier les tests échoués.
**3-4/7 tests réussis** : ❌ Problème partiel, consulter DEPLOYMENT-GUIDE.md
**0-2/7 tests réussis** : 🚨 Migration non appliquée, refaire le déploiement.

---

## 📞 Support

Si des tests échouent :
1. Consultez `DEPLOYMENT-GUIDE.md` → Section Dépannage
2. Exécutez `test-data-persistence.sql` pour diagnostic
3. Vérifiez les logs Supabase : Dashboard → Logs
4. Vérifiez la console navigateur (F12) pour les erreurs frontend

---

**Durée estimée** : 5-10 minutes
**Date** : 2026-02-12
