import { createClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';

/**
 * Cliente anónimo, sem cookies, para leitura pública do menu.
 * Não usa sessão para permitir render estático/ISR da página inicial.
 */
export function createPublicClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
