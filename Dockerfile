# ==============================================================================
# COOPERCARNE - PAINEL ADMINISTRATIVO
# Build multi-stage: compila a SPA (Vite) e serve os arquivos estáticos com Nginx.
# ==============================================================================

# ---- Stage 1: build ---------------------------------------------------------
# Builda SEM as credenciais reais: o Vite embute os fallbacks (placeholders)
# definidos em src/lib/supabase.ts. Os valores reais são injetados em runtime
# pelo entrypoint.sh, a partir de variáveis de ambiente comuns do container.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime ---------------------------------------------------------
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
