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

export const isConfigured = !isPlaceholder(rawUrl) && !isPlaceholder(rawAnonKey);

if (!isConfigured) {
  console.warn(
    '%c[COOPERCARNE Supabase] ⚠️ Credenciais do Supabase não configuradas no .env.\n' +
      'Por favor, configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env na raiz do projeto.',
    'color: #c51d1f; font-weight: bold; font-size: 12px;'
  );
}

const supabaseUrl = !isPlaceholder(rawUrl)
  ? rawUrl!
  : 'https://placeholder-coopercarne.supabase.co';

const supabaseAnonKey = !isPlaceholder(rawAnonKey)
  ? rawAnonKey!
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

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
