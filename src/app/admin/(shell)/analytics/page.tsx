import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  Clock,
  MessageSquare,
  MousePointerClick,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

import { requireAdmin } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

type AnalyticsTotals = {
  menu_opens: number;
  unique_sessions: number;
  product_opens: number;
  searches: number;
  feedback_opens: number;
  active_sessions: number;
  active_ms: number;
  product_engagement_ms: number;
};

type AnalyticsDailyPoint = {
  day: string;
  menu_opens: number;
  unique_sessions: number;
  product_opens: number;
};

type RankingItem = { slug: string; views: number };

type AnalyticsOverview = {
  days: number;
  totals: AnalyticsTotals;
  daily: AnalyticsDailyPoint[];
  top_products: RankingItem[];
  top_categories: RankingItem[];
};

type SummaryRow = {
  id: string;
  day: string;
  menu_opens: number;
  unique_sessions: number;
  product_views: number;
  searches: number;
  total_active_ms: number;
};

type FeedbackRow = { rating: number; status: string };

type ChartBucket = {
  label: string;
  menu_opens: number;
  product_opens: number;
};

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

const numberFormatter = new Intl.NumberFormat('pt-PT');

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDay(day: string): string {
  return dateFormatter.format(new Date(`${day}T00:00:00Z`));
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
}

function luandaDay(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function parsePeriod(value: string | string[] | undefined): Period {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return PERIODS.includes(parsed as Period) ? (parsed as Period) : 30;
}

function buildBuckets(days: number, daily: AnalyticsDailyPoint[]): ChartBucket[] {
  const byDay = new Map(daily.map((point) => [point.day, point]));
  const span = days <= 30 ? 1 : 7;
  const buckets: ChartBucket[] = [];

  for (let end = days - 1; end >= 0; end -= span) {
    const start = Math.max(0, end - span + 1);
    let menuOpens = 0;
    let productOpens = 0;
    let firstDay = '';
    let lastDay = '';

    for (let offset = start; offset <= end; offset += 1) {
      const day = luandaDay(-(days - 1 - offset));
      const point = byDay.get(day);

      if (offset === start) {
        firstDay = day;
      }

      lastDay = day;
      menuOpens += point?.menu_opens ?? 0;
      productOpens += point?.product_opens ?? 0;
    }

    buckets.unshift({
      label:
        span === 1 ? formatDay(firstDay) : `${formatDay(firstDay)} – ${formatDay(lastDay)}`,
      menu_opens: menuOpens,
      product_opens: productOpens,
    });
  }

  return buckets;
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-2">{label}</p>
          <p className="mt-2 font-display text-3xl text-strong tabular">{value}</p>
          <p className="mt-1 text-[11px] text-decor">{hint}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-tint text-blue">
          {icon}
        </span>
      </div>
    </div>
  );
}

function Ranking({
  title,
  items,
  names,
  empty,
}: {
  title: string;
  items: RankingItem[];
  names: Map<string, string>;
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.views));

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-xl text-strong">{title}</h2>

      {items.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li key={item.slug}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">
                  <span className="mr-2 text-xs text-decor tabular">{index + 1}.</span>
                  {names.get(item.slug) ?? item.slug}
                </span>
                <span className="shrink-0 text-xs text-ink-2 tabular">
                  {formatNumber(item.views)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-blue"
                  style={{ width: `${Math.round((item.views / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-ink-2">{empty}</p>
      )}
    </section>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl text-strong">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder ao analytics.
        </p>
      </div>
    );
  }

  const period = parsePeriod((await searchParams).d);
  const supabase = await createClient();
  const since = new Date(Date.now() - period * 86_400_000).toISOString();

  const [overviewResult, summaryResult, feedbackResult, productsResult, categoriesResult] =
    await Promise.all([
      supabase.rpc('analytics_overview', { p_days: period }),
      supabase
        .from('analytics_daily_summary')
        .select(
          'id, day, menu_opens, unique_sessions, product_views, searches, total_active_ms',
        )
        .gte('day', luandaDay(-period + 1))
        .order('day', { ascending: false })
        .limit(period),
      supabase
        .from('customer_feedback')
        .select('rating, status')
        .gte('created_at', since),
      supabase.from('products').select('slug, name'),
      supabase.from('categories').select('slug, name'),
    ]);

  const overview = (overviewResult.data as AnalyticsOverview | null) ?? null;
  const summary = (summaryResult.data as SummaryRow[] | null) ?? [];
  const feedback = (feedbackResult.data as FeedbackRow[] | null) ?? [];

  const productNames = new Map(
    ((productsResult.data as { slug: string; name: string }[] | null) ?? []).map((item) => [
      item.slug,
      item.name,
    ]),
  );
  const categoryNames = new Map(
    ((categoriesResult.data as { slug: string; name: string }[] | null) ?? []).map((item) => [
      item.slug,
      item.name,
    ]),
  );

  const totals = overview?.totals;
  const hasActivity = Boolean(
    totals && totals.menu_opens + totals.product_opens + totals.unique_sessions > 0,
  );

  const ratings = feedback.map((item) => item.rating);
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;
  const pendingFeedback = feedback.filter(
    (item) => item.status === 'new' || item.status === 'in_review',
  ).length;

  const chartBuckets = overview ? buildBuckets(period, overview.daily) : [];
  const chartMax = Math.max(
    1,
    ...chartBuckets.map((bucket) => Math.max(bucket.menu_opens, bucket.product_opens)),
  );
  const labelStep = chartBuckets.length > 14 ? Math.ceil(chartBuckets.length / 10) : 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
            Analytics
          </p>
          <h1 className="font-display text-3xl text-strong">Utilização do menu</h1>
          <p className="max-w-2xl text-sm text-ink-2">
            Estatísticas agregadas e anónimas. Sem cookies, sem geolocalização, sem fingerprint.
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border border-line bg-surface p-1"
          role="group"
          aria-label="Período"
        >
          {PERIODS.map((value) => (
            <Link
              key={value}
              href={`/admin/analytics?d=${value}`}
              aria-current={period === value ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                period === value
                  ? 'bg-blue font-medium text-primary-foreground'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              {value} dias
            </Link>
          ))}
        </div>
      </header>

      {overviewResult.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
        >
          <p className="font-medium">Não foi possível carregar as métricas em tempo real.</p>
          <p className="mt-1">
            Aplique a migração <code>0008_analytics_aggregation.sql</code> e recarregue a página.
          </p>
        </div>
      ) : null}

      {!overviewResult.error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Visitantes"
              value={
                totals && totals.unique_sessions > 0
                  ? formatNumber(totals.unique_sessions)
                  : '—'
              }
              hint="sessões anónimas no período"
              icon={<Users aria-hidden="true" className="size-4" />}
            />
            <KpiCard
              label="Aberturas do menu"
              value={hasActivity && totals ? formatNumber(totals.menu_opens) : '—'}
              hint="uma por sessão"
              icon={<MousePointerClick aria-hidden="true" className="size-4" />}
            />
            <KpiCard
              label="Produtos abertos"
              value={hasActivity && totals ? formatNumber(totals.product_opens) : '—'}
              hint="detalhes consultados"
              icon={<UtensilsCrossed aria-hidden="true" className="size-4" />}
            />
            <KpiCard
              label="Tempo médio ativo"
              value={
                totals && totals.active_sessions > 0
                  ? formatDuration(totals.active_ms / totals.active_sessions)
                  : '—'
              }
              hint="atenção efectiva por sessão"
              icon={<Clock aria-hidden="true" className="size-4" />}
            />
          </div>

          {!hasActivity ? (
            <p className="rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">
              Ainda não existem eventos neste período. As métricas começam a aparecer assim que o
              menu público for visitado.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-strong">Atividade</h2>
                  <p className="text-xs text-ink-2">
                    {period <= 30
                      ? 'Aberturas do menu e produtos por dia.'
                      : 'Aberturas do menu e produtos por semana.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-blue" />
                    Aberturas
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="size-2.5 rounded-full bg-ok" />
                    Produtos
                  </span>
                </div>
              </div>

              {hasActivity ? (
                <div className="mt-5">
                  <div className="flex h-36 items-end gap-1">
                    {chartBuckets.map((bucket, index) => (
                      <div
                        key={`${bucket.label}-${index}`}
                        className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5"
                      >
                        <div
                          className="w-1/2 rounded-t-sm bg-blue"
                          style={{
                            height: `${Math.round((bucket.menu_opens / chartMax) * 100)}%`,
                          }}
                        />
                        <div
                          className="w-1/2 rounded-t-sm bg-ok"
                          style={{
                            height: `${Math.round((bucket.product_opens / chartMax) * 100)}%`,
                          }}
                        />
                        <span className="sr-only">
                          {bucket.label}: {bucket.menu_opens} aberturas, {bucket.product_opens}{' '}
                          produtos
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-1 flex gap-1 border-t border-line pt-1">
                    {chartBuckets.map((bucket, index) => (
                      <div key={`label-${bucket.label}-${index}`} className="min-w-0 flex-1">
                        {index % labelStep === 0 ? (
                          <span className="hidden max-w-full truncate text-[9px] text-decor sm:block">
                            {bucket.label}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-2">
                  Sem atividade registada neste período.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="font-display text-xl text-strong">Feedback</h2>
              <p className="text-xs text-ink-2">Mensagens recebidas no período.</p>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-3xl text-strong tabular">
                    {feedback.length > 0 ? formatNumber(feedback.length) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-decor">mensagens</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-strong tabular">
                    {averageRating !== null ? averageRating.toFixed(1) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-decor">média de 5</p>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-2">
                <MessageSquare aria-hidden="true" className="size-3.5 text-decor" />
                {feedback.length > 0
                  ? `${pendingFeedback} por tratar`
                  : 'Ainda sem feedback neste período'}
              </p>

              <Link
                href="/admin/feedback"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue transition-colors hover:text-blue-700"
              >
                Abrir inbox
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Ranking
              title="Produtos mais abertos"
              items={overview?.top_products ?? []}
              names={productNames}
              empty="Sem produtos consultados neste período."
            />
            <Ranking
              title="Categorias mais vistas"
              items={overview?.top_categories ?? []}
              names={categoryNames}
              empty="Sem categorias vistas neste período."
            />
          </div>
        </>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-display text-xl text-strong">Resumo diário</h2>
          <p className="text-xs text-ink-2">
            Agregação automática às 02:00 (Africa/Luanda). Pode ficar até 24 horas atrasada em
            relação aos números em tempo real.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-5 py-3 font-medium text-ink-2">Dia</th>
                <th className="px-5 py-3 font-medium text-ink-2">Aberturas</th>
                <th className="px-5 py-3 font-medium text-ink-2">Sessões</th>
                <th className="px-5 py-3 font-medium text-ink-2">Produtos</th>
                <th className="px-5 py-3 font-medium text-ink-2">Pesquisas</th>
                <th className="px-5 py-3 font-medium text-ink-2">Tempo ativo</th>
              </tr>
            </thead>
            <tbody>
              {summary.length > 0 ? (
                summary.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-ink">{formatDay(row.day)}</td>
                    <td className="px-5 py-3 text-ink-2 tabular">{formatNumber(row.menu_opens)}</td>
                    <td className="px-5 py-3 text-ink-2 tabular">
                      {formatNumber(row.unique_sessions)}
                    </td>
                    <td className="px-5 py-3 text-ink-2 tabular">
                      {formatNumber(row.product_views)}
                    </td>
                    <td className="px-5 py-3 text-ink-2 tabular">{formatNumber(row.searches)}</td>
                    <td className="px-5 py-3 text-ink-2 tabular">
                      {row.total_active_ms > 0 ? formatDuration(row.total_active_ms) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink-2">
                    Sem resumos agregados para este período. O cron diário preenche esta tabela às
                    02:00 (Africa/Luanda).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-ink-2">
        Dados anónimos. Identificadores de sessão são removidos após 30 dias e os eventos
        apagados após 90 dias.
      </p>
    </div>
  );
}
