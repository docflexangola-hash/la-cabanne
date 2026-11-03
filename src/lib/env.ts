const MISSING_ENV_MESSAGE =
  'Configuração do Supabase em falta. Copia .env.example para .env.local e preenche as variáveis.';

function assertDefined(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${MISSING_ENV_MESSAGE} (${name})`);
  }

  return value;
}

/**
 * NEXT_PUBLIC_* vars must be accessed with a **static literal** so the
 * Next.js compiler can inline them into the client bundle at build time.
 * Using `process.env[dynamicKey]` breaks this – the bundler sees a
 * runtime property lookup and leaves it as-is, which resolves to
 * `undefined` in the browser.
 */

export function getSupabaseUrl(): string {
  return assertDefined(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return assertDefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

export function getSupabaseServiceRoleKey(): string {
  return assertDefined(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
