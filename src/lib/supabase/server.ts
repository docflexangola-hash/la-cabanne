import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a sessão do utilizador (cookies) — as políticas RLS aplicam-se.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies.
          // O refresh de sessão é feito em proxy.ts.
        }
      },
    },
  });
}
