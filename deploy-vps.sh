#!/bin/bash
# ============================================
# WONDER TEAM - Déploiement Application Source
# ============================================

set -euo pipefail

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; NC='\033[0m'

echo -e "${B}🚀 Déploiement de Wonder Team (Application Source Complète)${NC}\n"

cd /opt/wonder-team-production

# 1. Créer .env avec votre clé Supabase
cat > .env << 'ENVEOF'
VITE_SUPABASE_URL=https://kkkycawqnapjlhohojjl.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
NODE_ENV=production
ENVEOF

echo -e "${Y}⚠️  IMPORTANT: Éditez .env et ajoutez votre clé Supabase ANON${NC}"
echo "nano .env"
echo ""
read -p "Appuyez sur Entrée une fois .env configuré..."

# 2. Créer Dockerfile
cat > Dockerfile << 'DOCKEREOF'
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js ./
COPY index.html index.tsx index.css App.tsx types.ts ./
COPY pages/ pages/
COPY services/ services/

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache wget curl
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF

# 3. Créer nginx.conf
cat > nginx.conf << 'NGINXEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
NGINXEOF

# 4. Créer docker-compose.yml
cat > docker-compose.yml << 'COMPOSEEOF'
services:
  wonder-team:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: ${VITE_SUPABASE_URL}
        VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY}
    container_name: wonder-team-app
    restart: unless-stopped
    ports:
      - "3001:80"
    networks:
      - coolify
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wonder-team.rule=Host(`wonder-team.oe-securebytecloud-itservice.fr`)"
      - "traefik.http.routers.wonder-team.entrypoints=https"
      - "traefik.http.routers.wonder-team.tls=true"
      - "traefik.http.routers.wonder-team.tls.certresolver=letsencrypt"
      - "traefik.http.services.wonder-team.loadbalancer.server.port=80"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  coolify:
    external: true
COMPOSEEOF

echo -e "${G}✅ Fichiers Docker créés${NC}"

# 5. Build et Deploy
echo -e "${B}🔨 Build de l'application...${NC}"
docker compose down 2>/dev/null || true
docker system prune -af

docker compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${G}✅ Build réussi!${NC}"
    docker compose up -d
    sleep 10
    docker compose ps
    echo ""
    echo -e "${G}🌐 Application: https://wonder-team.oe-securebytecloud-itservice.fr${NC}"
    echo -e "${G}🔧 Debug: http://157.173.99.217:3001${NC}"
else
    echo -e "${R}❌ Build échoué${NC}"
    exit 1
fi
