# 🔍 Guide de Debugging et Validation - Wonder Team

Ce guide explique comment utiliser les systèmes de debugging et de validation de synchronisation implémentés dans Wonder Team.

## 📋 Table des matières

1. [Système de Debugging Auth](#système-de-debugging-auth)
2. [Validation de Synchronisation](#validation-de-synchronisation)
3. [Utilisation Pratique](#utilisation-pratique)
4. [Résolution de Problèmes](#résolution-de-problèmes)

---

## 🔐 Système de Debugging Auth

### Qu'est-ce que c'est ?

Un système de logging avancé qui trace **tous** les événements d'authentification :
- ✅ Connexion (Email/Password et Google OAuth)
- ✅ Déconnexion
- ✅ Événements Supabase Auth (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
- ✅ Appels API d'authentification
- ✅ Création/récupération de profil
- ✅ Erreurs d'authentification

### Où le trouver ?

**Page Profil** → Panneau "Système de Debugging Auth" (avec icône 🐛)

### Comment l'utiliser ?

#### 1. Activer le Debugging

1. Allez dans **Mon Espace** (page Profil)
2. Localisez le panneau **"Système de Debugging Auth"**
3. Cliquez sur le bouton **ON/OFF** pour activer
4. ✅ Le statut affichera "Activé - Tous les événements sont tracés"

#### 2. Voir les Logs

1. Cliquez sur **"Voir les logs"**
2. Les logs s'affichent en temps réel avec :
   - **Niveau** : INFO, DEBUG, ERROR, WARN, AUTH_EVENT
   - **Événement** : Description de l'action
   - **Source** : Composant/Service d'origine
   - **Timestamp** : Date et heure précises
   - **Détails** : Données associées (JSON)

#### 3. Types de Logs

| Type | Couleur | Description |
|------|---------|-------------|
| **AUTH_EVENT** | 🟢 Vert | Événements d'authentification importants |
| **ERROR** | 🔴 Rouge | Erreurs critiques |
| **WARN** | 🟡 Jaune | Avertissements |
| **DEBUG** | 🔵 Bleu | Informations de débogage détaillées |
| **INFO** | ⚪ Gris | Informations générales |

#### 4. Fonctionnalités Avancées

- **Rafraîchir** : Met à jour la liste des logs manuellement
- **Rafraîchissement Auto** : Active la mise à jour automatique toutes les 2 secondes
- **Effacer** : Supprime tous les logs de la session
- **Export JSON** : Télécharge les logs au format JSON structuré
- **Export TXT** : Télécharge un rapport lisible au format texte

### Exemple de Flow de Connexion Tracé

```
[AUTH INFO] [LoginFlow] START: Email Sign-In
  → email: user@example.com

[DEBUG] [DataService.signInWithEmail] Calling Supabase auth.signInWithPassword
  → email: user@example.com

[AUTH_EVENT] [DataService.signInWithEmail] Sign-In Success
  → userId: abc123...
  → email: user@example.com

[AUTH_EVENT] [Supabase.onAuthStateChange] Supabase Auth State Change: SIGNED_IN
  → hasSession: true
  → userId: abc123...
  → provider: email

[DEBUG] [App.onAuthStateChange] Ensuring profile exists for signed-in user
  → userId: abc123...

[AUTH_EVENT] [DataService.ensureProfile] Existing profile found
  → userId: abc123...
  → email: user@example.com

[AUTH_EVENT] [App.onAuthStateChange] Profile ready, redirecting to dashboard
  → userId: abc123...

[INFO] [LoginFlow] COMPLETE: Email Sign-In
  → userId: abc123...
  → email: user@example.com
```

---

## 🔄 Validation de Synchronisation

### Qu'est-ce que c'est ?

Un système qui vérifie que les données du **Frontend** (état en mémoire) sont bien **synchronisées** avec le **Backend** (Supabase).

Compare 4 types de données :
- 📦 **Produits**
- 👥 **Clients**
- 📋 **Commandes**
- 👤 **Profil**

### Où le trouver ?

**Page Profil** → Panneau "Validation de Synchronisation" (avec icône 💾)

### Comment l'utiliser ?

#### 1. Lancer une Validation

1. Allez dans **Mon Espace** (page Profil)
2. Localisez le panneau **"Validation de Synchronisation"**
3. Cliquez sur **"Valider"**
4. La validation compare automatiquement toutes les données

#### 2. Interpréter les Résultats

**Statut Global**
- ✅ **SYNCHRONISÉ** : Toutes les données sont cohérentes
- ❌ **DÉSYNCHRONISÉ** : Des incohérences ont été détectées

**Pour chaque entité (Produits, Clients, Commandes, Profil)**
- **Frontend Count** : Nombre d'éléments en mémoire
- **Backend Count** : Nombre d'éléments dans Supabase
- **Incohérences** : Données différentes entre Frontend/Backend
- **Manquants Backend** : Éléments présents en Frontend mais pas en Backend
- **Manquants Frontend** : Éléments présents en Backend mais pas en Frontend

#### 3. Voir les Détails

Cliquez sur une carte (ex: Produits) pour voir :
- Liste détaillée des incohérences
- Comparaison Frontend vs Backend
- Champs spécifiques qui diffèrent

#### 4. Exporter le Rapport

- **JSON** : Format structuré pour analyse automatique
- **TXT** : Rapport lisible pour revue manuelle

### Exemple de Rapport

```
=== DATA SYNC VALIDATION REPORT ===

Timestamp: 13/02/2026 15:30:45
Overall Status: ❌ OUT OF SYNC

==================================================
PRODUCTS
==================================================
Status: ❌ Out of Sync
Frontend Count: 12
Backend Count: 11
Mismatches: 2
Missing in Backend: 1
Missing in Frontend: 0

Details:
  1. [MISSING_BACKEND] Product "Parfum Rose" exists in frontend but not in backend
  2. [MISMATCH] Field "stock_total" mismatch for product "Parfum Lavande"
     Field: stock_total
     Frontend: 50
     Backend: 45
```

---

## 🎯 Utilisation Pratique

### Cas d'Usage 1 : Problème de Connexion

**Symptôme** : L'utilisateur ne peut pas se connecter

**Solution** :
1. Activer le **Système de Debugging Auth**
2. Tenter de se connecter
3. Consulter les logs pour identifier l'erreur :
   - Erreur Supabase ? (problème réseau, credentials)
   - Erreur de création de profil ? (problème DB)
   - Problème de redirection OAuth ? (configuration)

### Cas d'Usage 2 : Données Perdues Après Déconnexion

**Symptôme** : Les modifications faites disparaissent après déconnexion

**Solution** :
1. Avant de se déconnecter, lancer une **Validation de Synchronisation**
2. Vérifier que toutes les données sont bien synchronisées
3. Si des incohérences existent :
   - Exporter le rapport
   - Identifier quelles données ne sont pas persistées
   - Corriger le code de sauvegarde correspondant

### Cas d'Usage 3 : Flow OAuth Google Problématique

**Symptôme** : La connexion Google échoue ou boucle

**Solution** :
1. Activer le **Système de Debugging Auth**
2. Cliquer sur "Continuer avec Google"
3. Après la redirection, consulter les logs :
   - Vérifier l'événement `SIGNED_IN`
   - Vérifier la création/récupération du profil
   - Identifier où le flow s'interrompt

### Cas d'Usage 4 : Audit de Sécurité

**Objectif** : Vérifier que les données sensibles ne sont pas loggées

**Solution** :
1. Activer le debugging
2. Se connecter avec différentes méthodes
3. Exporter les logs en JSON
4. Vérifier que :
   - ✅ Les mots de passe sont marqués `[REDACTED]`
   - ✅ Les tokens ne sont pas visibles
   - ✅ Seules les métadonnées utiles sont loggées

---

## 🔧 Résolution de Problèmes

### Le Debugging ne s'active pas

**Cause** : localStorage bloqué ou désactivé

**Solution** :
- Vérifier que les cookies/localStorage sont autorisés
- Essayer en navigation privée pour tester
- Vérifier la console pour des erreurs JavaScript

### Les Logs sont vides

**Cause** : Debugging activé mais aucun événement déclenché

**Solution** :
- Vérifier que le toggle est bien sur **ON**
- Se déconnecter puis se reconnecter pour générer des événements
- Rafraîchir la page

### La Validation échoue

**Cause** : Problème de connexion Supabase ou authentification

**Solution** :
1. Vérifier la connexion Internet
2. Vérifier que vous êtes connecté
3. Consulter la console pour des erreurs
4. Vérifier les variables d'environnement Supabase

### Trop de Logs (Performance)

**Cause** : Le debugging est toujours actif en production

**Solution** :
- **Désactiver** le debugging après utilisation
- Les logs sont limités à 500 entrées max (auto-nettoyage)
- Effacer régulièrement avec le bouton "Effacer"

---

## 📊 Statistiques des Logs

Le panneau affiche en temps réel :
- Nombre total de logs
- Nombre d'erreurs
- Nombre d'événements auth
- Nombre de logs de debug

---

## 🚀 Bonnes Pratiques

1. **N'activez le debugging que quand nécessaire** (impact performance)
2. **Exportez les logs avant de les effacer** (pour historique)
3. **Validez la synchronisation après chaque modification importante**
4. **Partagez les rapports JSON avec l'équipe technique** en cas de bug
5. **Ne laissez JAMAIS le debugging actif en production finale**

---

## 📞 Support

Si vous rencontrez des problèmes avec ces outils :

1. Consultez d'abord ce guide
2. Exportez les logs de debugging
3. Exportez le rapport de validation
4. Contactez l'équipe technique avec ces fichiers

---

**Version** : 1.0.0
**Dernière mise à jour** : 13 février 2026
