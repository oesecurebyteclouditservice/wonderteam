# ⚡ Guide Rapide - Debugging & Validation

## 🚀 Démarrage en 60 secondes

### Option 1 : Débugger un Problème de Connexion

```bash
1. Ouvrir l'application
2. Aller dans "Mon Espace" (icône profil)
3. Localiser le panneau violet "Système de Debugging Auth"
4. Cliquer sur le bouton ON
5. Se déconnecter
6. Se reconnecter (avec Email ou Google)
7. Cliquer sur "Voir les logs"
8. Consulter le flow complet de connexion
9. Si erreur → Exporter en TXT et envoyer à l'équipe technique
```

### Option 2 : Vérifier la Synchronisation des Données

```bash
1. Ouvrir l'application
2. Aller dans "Mon Espace" (icône profil)
3. Localiser le panneau bleu "Validation de Synchronisation"
4. Cliquer sur "Valider"
5. Attendre 2-3 secondes
6. Résultat :
   - ✅ Vert = Tout est OK
   - ❌ Rouge = Problème détecté
7. Cliquer sur une carte rouge pour voir les détails
8. Exporter le rapport si nécessaire
```

---

## 🎯 Les 3 Scénarios les Plus Courants

### Scénario 1 : "Je ne peux pas me connecter avec Google"

**Solution en 3 étapes**
1. Activer le debugging auth (ON)
2. Cliquer sur "Continuer avec Google"
3. Après la tentative, voir les logs :
   - ✅ Si "Google OAuth redirect initiated" → La redirection fonctionne
   - ❌ Si "ERROR: Google OAuth Failed" → Problème de configuration
   - ✅ Si "SIGNED_IN event received" → L'auth fonctionne
   - ❌ Si "Failed to create profile" → Problème de DB

### Scénario 2 : "Mes produits disparaissent après déconnexion"

**Solution en 3 étapes**
1. Ajouter/modifier un produit
2. Lancer une validation de synchronisation
3. Vérifier la carte "Produits" :
   - ✅ Frontend Count = Backend Count → OK
   - ❌ "Missing in Backend" > 0 → Pas sauvegardé !

**Action** : Exporter le rapport et contacter l'équipe technique

### Scénario 3 : "L'application boucle à la connexion"

**Solution en 3 étapes**
1. Activer le debugging auth
2. Tenter de se connecter
3. Chercher dans les logs :
   - Si "Sign-In Success" mais pas de "Profile ready" → Problème de profil
   - Si plusieurs "SIGNED_IN" events → Boucle de redirection
   - Si "Token refreshed" en boucle → Problème de session

---

## 📱 Accès Rapide

### Où se trouvent les outils ?

```
Menu → Mon Espace → Scroll vers le bas

Panneau 1 (violet) : Système de Debugging Auth
Panneau 2 (bleu)   : Validation de Synchronisation
```

### Raccourcis Clavier (optionnel - à implémenter)

- `Ctrl + Shift + D` : Activer/désactiver le debugging
- `Ctrl + Shift + V` : Lancer la validation
- `Ctrl + Shift + E` : Exporter les logs

---

## 🎨 Codes Couleur

| Couleur | Signification |
|---------|---------------|
| 🟢 Vert | Tout va bien |
| 🔴 Rouge | Erreur critique |
| 🟡 Jaune | Avertissement |
| 🔵 Bleu | Information de debug |
| ⚪ Gris | Information neutre |

---

## 💡 Astuces Pro

### Astuce 1 : Auto-refresh des Logs
Cochez "Rafraîchir automatiquement" pour voir les logs en temps réel pendant que vous naviguez dans l'app.

### Astuce 2 : Exporter avant d'effacer
Toujours exporter les logs (JSON ou TXT) avant de cliquer sur "Effacer", au cas où vous en auriez besoin plus tard.

### Astuce 3 : Validation après chaque modification importante
Prenez l'habitude de valider la synchronisation après :
- Ajout de plusieurs produits
- Modification massive de stock
- Suppression de clients
- Changement de profil

### Astuce 4 : Comparer les rapports
Exportez les rapports de validation régulièrement pour comparer et voir l'évolution.

---

## ⚠️ Avertissements

1. **NE PAS** laisser le debugging actif en permanence (impact performance)
2. **NE PAS** partager les logs publiquement (peuvent contenir des emails)
3. **TOUJOURS** désactiver après utilisation
4. **TOUJOURS** vérifier que les mots de passe sont [REDACTED] avant de partager

---

## 🆘 En Cas de Problème

### Le panneau ne s'affiche pas
→ Vider le cache du navigateur et rafraîchir

### Le bouton ON/OFF ne fonctionne pas
→ Vérifier que localStorage est autorisé dans les paramètres du navigateur

### Aucun log n'apparaît
→ Se déconnecter et se reconnecter pour générer des événements

### La validation reste bloquée
→ Rafraîchir la page et réessayer

---

## 📞 Support Rapide

**Pour les développeurs**
- Exporter les logs en JSON
- Joindre le rapport de validation
- Envoyer sur le canal #tech

**Pour les utilisateurs**
- Faire une capture d'écran du panneau
- Noter l'heure exacte du problème
- Décrire les étapes avant l'erreur

---

## ✅ Checklist Rapide

Avant de signaler un bug :

- [ ] J'ai activé le debugging
- [ ] J'ai reproduit le problème
- [ ] J'ai consulté les logs
- [ ] J'ai exporté les logs/rapport
- [ ] J'ai noté l'heure exacte
- [ ] J'ai fait une capture d'écran

---

**Besoin de plus de détails ?**
→ Consultez `DEBUGGING-GUIDE.md` pour le guide complet

---

**Version** : 1.0.0
**Dernière mise à jour** : 13 février 2026
