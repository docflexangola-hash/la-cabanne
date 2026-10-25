import type { Metadata } from 'next';

import { isSupabaseConfigured } from '@/lib/env';
import { signIn } from '@/lib/auth/actions';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  credenciais: 'Credenciais inválidas. Verifica o email e a palavra-passe.',
  configuracao:
    'O Supabase ainda não está configurado. Preenche o ficheiro .env.local.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; next?: string }>;
}) {
  const { erro, next } = await searchParams;
  const configured = isSupabaseConfigured();
  const errorMessage = erro ? (ERROR_MESSAGES[erro] ?? ERROR_MESSAGES.credenciais) : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <p className="font-display text-4xl leading-none tracking-tight text-deep">
            La Cabanne
          </p>
          <p className="mt-3 text-[11px] font-medium tracking-[0.22em] text-ink-2 uppercase">
            Menu digital
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_rgba(18,62,100,0.08)] sm:p-8">
          <h1 className="font-display text-2xl text-deep">Entrar</h1>
          <p className="mt-1 text-sm text-ink-2">
            Acesso reservado à gerência e administração.
          </p>

          {!configured ? (
            <p
              role="status"
              className="mt-5 rounded-lg border border-[#B4472F]/30 bg-[#B4472F]/5 px-3 py-2 text-sm text-[#B4472F]"
            >
              {ERROR_MESSAGES.configuracao}
            </p>
          ) : null}

          {errorMessage ? (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-[#B4472F]/30 bg-[#B4472F]/5 px-3 py-2 text-sm text-[#B4472F]"
            >
              {errorMessage}
            </p>
          ) : null}

          <form action={signIn} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={next ?? ''} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={!configured}
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-decor focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/25 focus-visible:outline-none disabled:opacity-50"
                placeholder="nome@lacabanne.ao"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Palavra-passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={!configured}
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-decor focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/25 focus-visible:outline-none disabled:opacity-50"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={!configured}
              className="h-11 w-full rounded-lg bg-blue text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Entrar
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-2">
            Recuperação de palavra-passe disponível na fase de administração.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-decor">
          La Cabanne · Benguela, Angola
        </p>
      </div>
    </div>
  );
}
