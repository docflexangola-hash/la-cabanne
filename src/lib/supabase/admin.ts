import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/env';

/**
 * Cliente com service role. Ignora RLS.
 * Usar exclusivamente em código server-side (route handlers e scripts).
 */
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
