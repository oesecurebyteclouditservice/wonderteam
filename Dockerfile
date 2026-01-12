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
ARG VITE_GEMINI_API_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}

RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache wget curl
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
