import type { Metadata } from 'next';
import Link from 'next/link';

import { getStaffMember } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = { title: 'Visão geral' };
export const dynamic = 'force-dynamic';

const KPI_PLACEHOLDERS = [
  { label: 'Aberturas do menu' },
  { label: 'Sessões de consulta' },
  { label: 'Tempo activo médio' },
  { label: 'Avaliação média' },
];

const FOUNDATION_CHECKS = [
  { label: 'Next.js, TypeScript e Tailwind configurados', done: true },
  { label: 'Tokens de cor, tipografia e componentes base', done: true },
  { label: 'Migrations do cardápio e RLS', done: true },
  { label: 'Autenticação e protecção de /admin', done: true },
  { label: 'Dados do restaurante e menu importado', done: false },
];

export default async function DashboardPage() {
  const staff = await getStaffMember();
  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Visão geral
        </p>
        <h1 className="font-display text-3xl text-deep">
          Olá, {staff?.displayName ?? 'gerência'}
        </h1>
        <p className="max-w-2xl text-sm text-ink-2">
          A fundação do sistema está pronta. Os indicadores só aparecem quando houver
          eventos reais — nenhuma estatística é simulada.
        </p>
      </header>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_PLACEHOLDERS.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-medium tracking-[0.1em] text-ink-2 uppercase">
              {kpi.label}
            </p>
            <p className="mt-2 font-display text-4xl text-decor">—</p>
            <p className="mt-1 text-xs text-ink-2">Sem dados suficientes</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl text-deep">Estado da implementação</h2>
          <p className="mt-1 text-sm text-ink-2">Fase 1 — Fundação</p>

          <ul className="mt-5 space-y-3">
            {FOUNDATION_CHECKS.map((check) => (
              <li key={check.label} className="flex items-start gap-3 text-sm">
                <span
                  aria-hidden="true"
                  className={
                    check.done
                      ? 'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D5B]/10 text-[11px] font-bold text-[#2E7D5B]'
                      : 'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] text-decor'
                  }
                >
                  {check.done ? '✓' : '·'}
                </span>
                <span className={check.done ? 'text-ink' : 'text-ink-2'}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl text-deep">Ligações</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-2">Supabase</dt>
              <dd
                className={
                  configured ? 'font-medium text-[#2E7D5B]' : 'font-medium text-[#B4472F]'
                }
              >
                {configured ? 'Configurado' : 'Não configurado'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-2">Ambiente</dt>
              <dd className="font-medium text-ink">
                {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
              </dd>
            </div>
          </dl>

          {!configured ? (
            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">
              Copia <code className="font-mono">.env.example</code> para{' '}
              <code className="font-mono">.env.local</code> e preenche as chaves do
              Supabase.
            </p>
          ) : null}

          <Link
            href="/admin/settings"
            className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-blue hover:text-blue-700"
          >
            Ir para configurações
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-xl text-deep">Próximos passos</h2>
        <ol className="mt-4 space-y-2 text-sm text-ink-2">
          <li>1. Preencher os caminhos das imagens em IMAGENS.md.</li>
          <li>2. Confirmar contactos, morada, horário e IVA.</li>
          <li>3. Transcrever o cardápio para o CSV de importação.</li>
          <li>4. Implementar o menu público (Fase 2).</li>
        </ol>
      </section>
    </div>
  );
}
