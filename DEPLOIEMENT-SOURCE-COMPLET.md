# 🚀 WONDER TEAM - Déploiement Application Source Complète

## ✅ CONTENU

Cette archive contient l'application **EXACTE** du fichier source avec:
- **9 pages complètes** : Login, Dashboard, Catalog, Clients, Orders, POS, Stock, Finance, Profile
- **4 services** : Supabase, Gemini AI, dataService, mockData
- **TypeScript configuré** pour compiler sans erreurs
- **Tailwind CSS** pour le design
- **Tous les composants** de l'application originale

---

## 📋 DÉPLOIEMENT EN 4 ÉTAPES

### ÉTAPE 1 : Transférer sur le VPS

```bash
# Depuis votre machine
scp wonder-team-source-complete.tar.gz root@157.173.99.217:/opt/wonder-team-production/
```

### ÉTAPE 2 : Extraire sur le VPS

```bash
# Se connecter au VPS
ssh root@157.173.99.217

# Extraire
cd /opt/wonder-team-production
tar -xzf wonder-team-source-complete.tar.gz

# Vérifier
ls -la
```

### ÉTAPE 3 : Configurer la clé Supabase

```bash
nano .env
```

Remplacez:
```
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Par votre vraie clé depuis: https://supabase.com/dashboard/project/kkkycawqnapjlhohojjl/settings/api

Sauvegardez: `Ctrl+X`, `Y`, `Enter`

### ÉTAPE 4 : Déployer

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

---

## 🌐 ACCÈS

- **URL principale:** https://wonder-team.oe-securebytecloud-itservice.fr
- **URL debug:** http://157.173.99.217:3001

---

## ✅ VÉRIFICATION

```bash
# Status
docker compose ps

# Logs
docker compose logs -f

# Health check
curl http://localhost:3001/health
```

---

## 🎯 DIFFÉRENCES AVEC LA VERSION PRÉCÉDENTE

| Avant | Maintenant |
|-------|------------|
| ❌ Page statique | ✅ Application complète |
| ❌ Données fictives | ✅ Connexion Supabase réelle |
| ❌ Navigation limitée | ✅ 9 pages fonctionnelles |
| ❌ Pas d'interactions | ✅ CRUD complet |
| ❌ Design basique | ✅ Interface professionnelle |

---

## 📦 STRUCTURE DE L'APPLICATION

```
wonder-team/
├── App.tsx              # Application principale avec navigation
├── index.tsx            # Point d'entrée
├── types.ts             # Types TypeScript
├── pages/               # 9 pages complètes
│   ├── Login.tsx        # Authentification
│   ├── Dashboard.tsx    # Tableau de bord
│   ├── Catalog.tsx      # Catalogue produits
│   ├── Clients.tsx      # Gestion clients
│   ├── Orders.tsx       # Commandes
│   ├── POS.tsx          # Point de vente
│   ├── Stock.tsx        # Gestion stocks
│   ├── Finance.tsx      # Finance
│   └── ProfilePage.tsx  # Profil utilisateur
├── services/            # Services backend
│   ├── supabase.ts      # Client Supabase
│   ├── geminiService.ts # Gemini AI
│   ├── dataService.ts   # CRUD operations
│   └── mockData.ts      # Données de test
└── docker/              # Configuration Docker
```

---

## 🔧 RÉSOLUTION DES PROBLÈMES

### Build échoue

```bash
# Voir les logs détaillés
docker compose build --no-cache 2>&1 | tee build.log
tail -100 build.log
```

### Container ne démarre pas

```bash
# Voir les logs du container
docker compose logs wonder-team

# Redémarrer
docker compose restart
```

### Application inaccessible

```bash
# Vérifier Traefik
docker ps | grep coolify-proxy

# Redémarrer Traefik si nécessaire
docker restart coolify-proxy
```

---

## 🎉 SUCCÈS !

Une fois déployé, vous aurez l'application **COMPLÈTE et IDENTIQUE** au fichier source !

**Version:** 3.0 - Source Complete Edition
**Date:** 2026-01-12
