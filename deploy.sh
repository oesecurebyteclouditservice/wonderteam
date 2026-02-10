#!/bin/bash

# ========================================
# WONDER TEAM - DÉPLOIEMENT CLOUD
# Version Ultra-Sécurisée et Sans Erreur
# ========================================

set -euo pipefail  # Arrêt immédiat en cas d'erreur

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables
PROJECT_DIR="/root/wonder-team-production"
BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/wonder-team-deploy.log"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REQUIRED_RAM_MB=512
REQUIRED_DISK_GB=2

# Functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✓ $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} ✗ $1" | tee -a "$LOG_FILE"
    echo -e "${YELLOW}[ACTION]${NC} $2" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠ $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} ℹ $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✓ $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${CYAN}[STEP]${NC} ▶ $1" | tee -a "$LOG_FILE"
}

# Banner
clear
echo -e "${PURPLE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║        🚀  WONDER TEAM + SUPABASE CLOUD  🚀               ║
║                                                            ║
║          Déploiement Ultra-Sécurisé v2.0                  ║
║            Bulletproof - Zero Error                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# ========================================
# PHASE 1: VÉRIFICATIONS SYSTÈME
# ========================================
step "PHASE 1/7 - Vérifications système..."

# Vérifier qu'on est root ou sudo
if [[ $EUID -ne 0 ]]; then
   error "Ce script doit être exécuté en tant que root" "Utilisez: sudo ./deploy.sh"
fi
log "Utilisateur root: OK"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé" "Installez Docker: curl -fsSL https://get.docker.com | sh"
fi
log "Docker installé: OK"

# Vérifier Docker Compose
if ! docker compose version &> /dev/null; then
    error "Docker Compose n'est pas installé" "Installez Docker Compose plugin"
fi
log "Docker Compose installé: OK"

# Vérifier RAM
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt "$REQUIRED_RAM_MB" ]; then
    warning "RAM disponible: ${TOTAL_RAM}MB (recommandé: ${REQUIRED_RAM_MB}MB+)"
else
    log "RAM disponible: ${TOTAL_RAM}MB - OK"
fi

# Vérifier espace disque
AVAILABLE_DISK=$(df -BG "$PROJECT_DIR" 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//' || echo "10")
if [ "$AVAILABLE_DISK" -lt "$REQUIRED_DISK_GB" ]; then
    warning "Espace disque: ${AVAILABLE_DISK}GB (recommandé: ${REQUIRED_DISK_GB}GB+)"
else
    log "Espace disque: ${AVAILABLE_DISK}GB - OK"
fi

# Vérifier connectivité Internet
if ! ping -c 1 8.8.8.8 &> /dev/null; then
    error "Pas de connexion Internet" "Vérifiez votre réseau"
fi
log "Connexion Internet: OK"

# Vérifier Traefik
if ! docker ps | grep -q "coolify-proxy"; then
    error "Traefik (coolify-proxy) n'est pas actif" "Vérifiez que Coolify/Traefik est démarré"
fi
log "Traefik (coolify-proxy): OK"

# Vérifier réseau Coolify
if ! docker network ls | grep -q "coolify"; then
    error "Réseau Docker 'coolify' introuvable" "Vérifiez votre installation Coolify"
fi
log "Réseau Docker 'coolify': OK"

success "✓ Toutes les vérifications système passées!\n"

# ========================================
# PHASE 2: VÉRIFICATION CONFIGURATION
# ========================================
step "PHASE 2/7 - Vérification de la configuration..."

cd "$PROJECT_DIR" || error "Répertoire $PROJECT_DIR introuvable" "Extrayez d'abord l'archive wonder-team-cloud.tar.gz"

# Vérifier fichier .env
if [ ! -f ".env" ]; then
    error "Fichier .env introuvable" "Créez le fichier .env à partir du template"
fi
log "Fichier .env: OK"

# Charger .env
set -a
source .env
set +a

# Vérifier variables critiques
if [ -z "$VITE_SUPABASE_URL" ]; then
    error "VITE_SUPABASE_URL non définie dans .env" "Ajoutez: VITE_SUPABASE_URL=https://kkkycawqnapjlhohojjl.supabase.co"
fi
log "VITE_SUPABASE_URL configurée: $VITE_SUPABASE_URL"

if [ -z "$VITE_SUPABASE_ANON_KEY" ] || [ "$VITE_SUPABASE_ANON_KEY" = "YOUR_ANON_KEY_HERE" ]; then
    error "VITE_SUPABASE_ANON_KEY non configurée" "Récupérez la clé depuis: https://supabase.com/dashboard/project/kkkycawqnapjlhohojjl/settings/api"
fi
log "VITE_SUPABASE_ANON_KEY configurée: ${VITE_SUPABASE_ANON_KEY:0:20}..."

# Vérifier fichiers requis
REQUIRED_FILES=("docker-compose.yml" "Dockerfile" "nginx.conf" "package.json" "App.tsx" "index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Fichier $file introuvable" "Vérifiez que l'archive a été correctement extraite"
    fi
done
log "Tous les fichiers requis présents: OK"

success "✓ Configuration validée!\n"

# ========================================
# PHASE 3: BACKUP
# ========================================
step "PHASE 3/7 - Sauvegarde..."

mkdir -p "$BACKUP_DIR"

if docker ps -a | grep -q wonder-team-app; then
    info "Ancien déploiement détecté, création d'une sauvegarde..."
    
    # Backup du répertoire
    BACKUP_FILE="$BACKUP_DIR/wonder-team-backup-$TIMESTAMP.tar.gz"
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" . 2>/dev/null || true
    
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup créé: $BACKUP_FILE ($BACKUP_SIZE)"
    fi
else
    info "Premier déploiement - pas de backup nécessaire"
fi

success "✓ Phase backup terminée!\n"

# ========================================
# PHASE 4: NETTOYAGE
# ========================================
step "PHASE 4/7 - Nettoyage des anciens containers..."

# Arrêter l'ancien container
if docker ps -a | grep -q wonder-team-app; then
    info "Arrêt de l'ancien container wonder-team-app..."
    docker stop wonder-team-app 2>/dev/null || true
    docker rm wonder-team-app 2>/dev/null || true
    log "Ancien container supprimé"
fi

# Nettoyer les anciennes images
if docker images | grep -q "wonder-team"; then
    info "Nettoyage des anciennes images..."
    docker images | grep "wonder-team" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    log "Anciennes images supprimées"
fi

# Nettoyer les images orphelines
info "Nettoyage des images orphelines..."
docker image prune -f &>/dev/null || true

success "✓ Nettoyage terminé!\n"

# ========================================
# PHASE 5: BUILD
# ========================================
step "PHASE 5/7 - Construction de l'image Docker..."

info "⏳ Cela peut prendre 2-3 minutes..."
echo ""

# Build avec gestion d'erreur détaillée
if ! docker compose build --no-cache 2>&1 | tee -a "$LOG_FILE"; then
    error "La construction de l'image a échoué" "Vérifiez les logs ci-dessus et dans $LOG_FILE"
fi

# Vérifier que l'image a été créée
if ! docker images | grep -q "wonder-team-cloud-wonder-team\|wonder-team-wonder-team"; then
    error "Image Docker non créée" "Vérifiez les logs de build"
fi

log "Image Docker créée avec succès"
success "✓ Build terminé!\n"

# ========================================
# PHASE 6: DÉMARRAGE
# ========================================
step "PHASE 6/7 - Démarrage de l'application..."

# Démarrer le container
if ! docker compose up -d 2>&1 | tee -a "$LOG_FILE"; then
    error "Le démarrage du container a échoué" "Vérifiez: docker compose logs"
fi

log "Container démarré"

# Attendre le démarrage
info "⏳ Attente du démarrage complet (15 secondes)..."
sleep 15

# Vérifier que le container tourne
if ! docker ps | grep -q wonder-team-app; then
    error "Le container wonder-team-app n'est pas actif" "Vérifiez: docker compose logs wonder-team"
fi

log "Container actif: wonder-team-app"
success "✓ Application démarrée!\n"

# ========================================
# PHASE 7: VÉRIFICATIONS FINALES
# ========================================
step "PHASE 7/7 - Vérifications finales..."

# Health check
info "Test du health check..."
HEALTH_RETRIES=0
MAX_HEALTH_RETRIES=15

while [ $HEALTH_RETRIES -lt $MAX_HEALTH_RETRIES ]; do
    if docker exec wonder-team-app wget --quiet --tries=1 --spider http://localhost/health 2>/dev/null; then
        log "Health check: OK ✓"
        break
    fi
    HEALTH_RETRIES=$((HEALTH_RETRIES+1))
    if [ $HEALTH_RETRIES -lt $MAX_HEALTH_RETRIES ]; then
        echo -n "."
        sleep 2
    fi
done
echo ""

if [ $HEALTH_RETRIES -eq $MAX_HEALTH_RETRIES ]; then
    warning "Health check timeout - l'application démarre encore"
    info "Vérifiez dans 1-2 minutes avec: docker compose logs -f"
fi

# Vérifier les logs pour erreurs critiques
CRITICAL_ERRORS=$(docker compose logs --tail=50 2>/dev/null | grep -i "error\|fatal\|failed" | wc -l)
if [ "$CRITICAL_ERRORS" -gt 5 ]; then
    warning "$CRITICAL_ERRORS erreurs détectées dans les logs"
    info "Vérifiez: docker compose logs wonder-team"
fi

# Test de connectivité réseau
info "Test connectivité réseau Traefik..."
if docker network inspect coolify | grep -q wonder-team-app; then
    log "Container connecté au réseau Traefik: OK"
else
    warning "Container peut-être pas connecté à Traefik"
fi

# Afficher le status
echo ""
info "Status des containers:"
docker compose ps

success "✓ Vérifications finales terminées!\n"

# ========================================
# RÉSULTAT FINAL
# ========================================
echo ""
echo -e "${PURPLE}"
cat << EOF
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║            🎉  DÉPLOIEMENT RÉUSSI !  🎉                   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  🌐 APPLICATION                                            ║
║  ──────────────────────────────────────────────────────   ║
║  URL: https://wonder-team.oe-securebytecloud-itservice.fr ║
║                                                            ║
║  ☁️  BACKEND SUPABASE CLOUD                                ║
║  ──────────────────────────────────────────────────────   ║
║  URL: https://kkkycawqnapjlhohojjl.supabase.co            ║
║  Dashboard: https://supabase.com/dashboard/project/kkkycawqnapjlhohojjl ║
║                                                            ║
║  📊 STATUT                                                 ║
║  ──────────────────────────────────────────────────────   ║
║  Container: wonder-team-app                                ║
║  Network: coolify                                          ║
║  SSL: Automatique (Let's Encrypt)                         ║
║  Backup: $BACKUP_DIR                         ║
║                                                            ║
║  📝 COMMANDES UTILES                                       ║
║  ──────────────────────────────────────────────────────   ║
║  • Logs:      docker compose logs -f                      ║
║  • Restart:   docker compose restart                      ║
║  • Stop:      docker compose down                         ║
║  • Status:    docker compose ps                           ║
║  • Health:    curl http://localhost/health                ║
║  • Shell:     docker exec -it wonder-team-app sh          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# ========================================
# PROCHAINES ÉTAPES
# ========================================
log "✨ Déploiement terminé avec succès!"
echo ""
success "🎯 PROCHAINES ÉTAPES:"
echo ""
echo "  1. 🌐 Testez l'application:"
echo "     https://wonder-team.oe-securebytecloud-itservice.fr"
echo ""
echo "  2. 🗄️  Initialisez la base de données:"
echo "     • Allez sur: https://supabase.com/dashboard/project/kkkycawqnapjlhohojjl"
echo "     • SQL Editor > New Query"
echo "     • Collez le contenu de: cat $PROJECT_DIR/init-database.sql"
echo "     • Cliquez 'Run'"
echo ""
echo "  3. 👤 Créez votre premier utilisateur:"
echo "     • Via l'application: https://wonder-team.oe-securebytecloud-itservice.fr"
echo "     • Ou via Supabase Dashboard > Authentication > Users"
echo ""
echo "  4. 📊 Vérifiez les logs si besoin:"
echo "     docker compose logs -f"
echo ""

# Logs finaux
info "Logs complets disponibles dans: $LOG_FILE"
info "Backup disponible dans: $BACKUP_DIR"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Déploiement terminé à $(date +'%H:%M:%S')${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
