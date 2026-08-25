#!/bin/sh
# Injeta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY em runtime, substituindo
# os placeholders que ficaram compilados no bundle (o build roda sem esses
# valores, então o Vite embute os fallbacks definidos em src/lib/supabase.ts).
# Isso evita depender de "Build Args" do painel de hospedagem — só variáveis
# de ambiente normais (runtime), que todo painel Docker suporta.
set -e

PLACEHOLDER_URL="https://placeholder-coopercarne.supabase.co"
PLACEHOLDER_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
HTML_DIR="/usr/share/nginx/html"

if [ -n "$VITE_SUPABASE_URL" ]; then
  grep -rl "$PLACEHOLDER_URL" "$HTML_DIR" 2>/dev/null | xargs -r sed -i "s|$PLACEHOLDER_URL|$VITE_SUPABASE_URL|g"
fi

if [ -n "$VITE_SUPABASE_ANON_KEY" ]; then
  grep -rl "$PLACEHOLDER_KEY" "$HTML_DIR" 2>/dev/null | xargs -r sed -i "s|$PLACEHOLDER_KEY|$VITE_SUPABASE_ANON_KEY|g"
fi

exec "$@"
