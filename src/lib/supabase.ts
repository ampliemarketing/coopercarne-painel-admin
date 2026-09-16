import { createClient } from '@supabase/supabase-js';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types/supabase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isPlaceholder = (val?: string) => {
  if (!val || typeof val !== 'string') return true;
  const trimmed = val.trim();
  return (
    trimmed === '' ||
    trimmed.includes('sua-url-supabase') ||
    trimmed.includes('SUA_URL') ||
    trimmed.includes('sua-anon-key') ||
    trimmed.includes('SUA_ANON_KEY') ||
    trimmed.includes('placeholder')
  );
};

const supabaseUrl = !isPlaceholder(rawUrl)
  ? rawUrl!
  : 'https://placeholder-coopercarne.supabase.co';

const supabaseAnonKey = !isPlaceholder(rawAnonKey)
  ? rawAnonKey!
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

// Checado em cima de supabaseUrl/supabaseAnonKey (não de rawUrl/rawAnonKey):
// no build via Docker essas variáveis não existem em build-time (o entrypoint.sh
// injeta os valores reais depois, via substituição de string em runtime), então
// checar os valores "raw" ficaria sempre travado em `false` mesmo depois da
// substituição rodar com sucesso.
export const isConfigured = !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    '%c[COOPERCARNE Supabase] ⚠️ Credenciais do Supabase não configuradas no .env.\n' +
      'Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env na raiz do projeto.',
    'color: #c51d1f; font-weight: bold; font-size: 12px;'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'coopercarne-admin-auth',
  },
});

export const isSupabaseReady = (): boolean => isConfigured;

export type { Database, Tables, TablesInsert, TablesUpdate };
export type Profile = Tables<'profiles'>;
