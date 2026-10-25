/**
 * Cria (ou actualiza) um utilizador administrativo.
 *
 * Uso:
 *   node --env-file=.env.local scripts/create-admin.mjs
 *
 * Variáveis necessárias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_NAME (opcional)
 *
 * Este script usa a service role key. Nunca executar no browser.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_NAME ?? 'Administrador';

if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (!email || !password) {
  console.error('Faltam ADMIN_EMAIL ou ADMIN_PASSWORD.');
  process.exit(1);
}

if (password.length < 12) {
  console.error('A palavra-passe deve ter pelo menos 12 caracteres.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { display_name: displayName },
});

if (error) {
  console.error('Erro ao criar utilizador:', error.message);
  process.exit(1);
}

const userId = data.user.id;

const { error: profileError } = await supabase
  .from('admin_profiles')
  .upsert(
    {
      id: userId,
      role: 'admin',
      display_name: displayName,
      is_active: true,
    },
    { onConflict: 'id' },
  );

if (profileError) {
  console.error('Utilizador criado, mas o perfil falhou:', profileError.message);
  process.exit(1);
}

console.log(`Administrador criado: ${email} (${userId})`);
