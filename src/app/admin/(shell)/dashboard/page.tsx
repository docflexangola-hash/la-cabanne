import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
  Star,
  Tags,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const FEEDBACK_TYPE_LABEL: Record<string, string> = {
  compliment: 'Elogio',
  suggestion: 'Sugestão',
  complaint: 'Reclamação',
  other: 'Outro',
};

type LatestFeedback = {
  id: string;
  type: string;
  rating: number;
  comment: string;
  name: string | null;
  status: string;
  created_at: string;
};

type AnalyticsOverview = {
  totals?: { unique_sessions?: number };
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const staff = await requireStaff();
  const isAdmin = staff.role === 'admin';

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl text-strong">Supabase não configurado</p>
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
    { data: latestFeedback, error: latestFeedbackError },
    visitorsResult,
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('customer_feedback').select('*', { count: 'exact', head: true }),
    supabase
      .from('customer_feedback')
      .select('id, type, rating, comment, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    isAdmin
      ? supabase.rpc('analytics_overview', { p_days: 7 })
      : Promise.resolve({ data: null as AnalyticsOverview | null, error: null }),
  ]);

  const hasError = Boolean(
    productsError || categoriesError || feedbackError || latestFeedbackError,
  );

  const visitorsCount =
    visitorsResult.error === null
      ? ((visitorsResult.data as AnalyticsOverview | null)?.totals?.unique_sessions ?? null)
      : null;

  const cards = [
    {
      href: '/admin/products',
      label: 'Produtos',
      value: productsError ? '—' : productsCount || 0,
      icon: UtensilsCrossed,
      hint: 'no cardápio',
    },
    {
      href: '/admin/categories',
      label: 'Categorias',
      value: categoriesError ? '—' : categoriesCount || 0,
      icon: Tags,
      hint: 'organizadas por grupo',
    },
    {
      href: '/admin/feedback',
      label: 'Feedback recebido',
      value: feedbackError ? '—' : feedbackCount || 0,
      icon: MessageSquare,
      hint: 'mensagens dos clientes',
    },
    ...(isAdmin
      ? [
          {
            href: '/admin/analytics',
            label: 'Visitantes (7 dias)',
            value: visitorsCount === null ? '—' : visitorsCount,
            icon: Users,
            hint: 'sessões anónimas',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
            Visão geral
          </p>
          <h1 className="font-display text-3xl text-strong">Dashboard</h1>
          <p className="text-sm text-ink-2">Resumo rápido do menu digital.</p>
        </div>

        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          Ver site
        </Link>
      </header>

      {hasError ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          <p className="font-medium">Alguns indicadores não puderam ser carregados.</p>
          <p className="mt-1">
            {feedbackError || latestFeedbackError
              ? 'O feedback está indisponível porque a tabela ainda não existe. Aplique a migração 0007_feedback.sql.'
              : 'Verifique a ligação à base de dados e recarregue a página.'}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          'grid gap-4 sm:grid-cols-2',
          isAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3',
        )}
      >
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-blue hover:bg-blue-tint/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-2">{card.label}</p>
                  <p className="mt-2 font-display text-3xl text-strong tabular">{card.value}</p>
                  <p className="mt-1 text-[11px] text-decor">{card.hint}</p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-tint text-blue transition-colors group-hover:bg-blue group-hover:text-primary-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-xl text-strong">Últimos feedbacks</h2>
            <p className="text-xs text-ink-2">As 3 mensagens mais recentes dos clientes.</p>
          </div>

          <Link
            href="/admin/feedback"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue transition-colors hover:text-blue-700"
          >
            Ver todos
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {(latestFeedback as LatestFeedback[] | null)?.length ? (
          <ul className="divide-y divide-line">
            {(latestFeedback as LatestFeedback[]).map((item) => (
              <li key={item.id}>
                <Link
                  href="/admin/feedback"
                  className="block px-5 py-4 transition-colors hover:bg-surface-2"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-blue-tint px-2 py-0.5 font-medium text-strong">
                      {FEEDBACK_TYPE_LABEL[item.type] ?? item.type}
                    </span>

                    <span
                      role="img"
                      aria-label={`${item.rating} de 5 estrelas`}
                      className="inline-flex items-center gap-0.5 text-amber-500"
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          aria-hidden="true"
                          className={cn(
                            'size-3.5',
                            index < item.rating ? 'fill-current' : 'text-line',
                          )}
                        />
                      ))}
                    </span>

                    <span className="text-decor">·</span>
                    <span className="text-ink-2">{formatDate(item.created_at)}</span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-ink">{item.comment}</p>

                  {item.name ? (
                    <p className="mt-1 text-xs text-ink-2">— {item.name}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-ink-2">
            Ainda não há feedback registado.
          </p>
        )}
      </section>
    </div>
  );
}
