# ==============================================================================
# COOPERCARNE - PAINEL ADMINISTRATIVO
# Build multi-stage: compila a SPA (Vite) e serve os arquivos estáticos com Nginx.
# ==============================================================================

# ---- Stage 1: build ---------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Variáveis do Supabase são compiladas DENTRO do bundle pelo Vite em build-time,
# não em runtime. Passe-as como Build Args no EasyPanel (não como env var comum).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ---------------------------------------------------------
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
