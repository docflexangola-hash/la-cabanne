import type { Metadata } from 'next';

import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireStaff();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder ao dashboard.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [
    { count: productsCount, error: productsError },
    { count: categoriesCount, error: categoriesError },
    { count: feedbackCount, error: feedbackError },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('customer_feedback').select('*', { count: 'exact', head: true }),
  ]);

  const hasError = Boolean(productsError || categoriesError || feedbackError);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Visão geral
        </p>
        <h1 className="font-display text-3xl text-deep">Dashboard</h1>
        <p className="text-sm text-ink-2">Resumo rápido do menu digital.</p>
      </header>

      {hasError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-medium">Alguns indicadores não puderam ser carregados.</p>
          <p className="mt-1 text-red-600">
            {feedbackError
              ? 'O feedback está indisponível porque a tabela ainda não existe. Aplique a migração 0007_feedback.sql.'
              : 'Verifique a ligação à base de dados e recarregue a página.'}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Produtos</p>
          <p className="mt-2 font-display text-3xl text-deep">
            {productsError ? '—' : productsCount || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Categorias</p>
          <p className="mt-2 font-display text-3xl text-deep">
            {categoriesError ? '—' : categoriesCount || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Feedback recebido</p>
          <p className="mt-2 font-display text-3xl text-deep">
            {feedbackError ? '—' : feedbackCount || 0}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="font-medium text-ink">Estado</p>
        <p className="mt-1 text-sm text-ink-2">
          Fases 4 e 5 implementadas com estruturas base. Conteúdo real e deploy ainda pendentes conforme PLANO.md.
        </p>
      </div>
    </div>
  );
}
