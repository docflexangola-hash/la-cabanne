import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder ao analytics.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ count: eventsCount }, { data: summary }] = await Promise.all([
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }),
    supabase
      .from('analytics_daily_summary')
      .select('*')
      .order('day', { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Fase 4
        </p>
        <h1 className="font-display text-3xl text-deep">Analytics</h1>
        <p className="max-w-2xl text-sm text-ink-2">
          Estatísticas agregadas e anónimas de utilização do menu.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Eventos registados</p>
          <p className="mt-2 font-display text-3xl text-deep">{eventsCount || 0}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Dias com resumo</p>
          <p className="mt-2 font-display text-3xl text-deep">{summary?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs text-ink-2">Último dia</p>
          <p className="mt-2 text-sm text-deep">{summary?.[0]?.day || '—'}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-ink-2">Dia</th>
              <th className="px-4 py-3 font-medium text-ink-2">Aberturas</th>
              <th className="px-4 py-3 font-medium text-ink-2">Sessões únicas</th>
              <th className="px-4 py-3 font-medium text-ink-2">Vistas produto</th>
              <th className="px-4 py-3 font-medium text-ink-2">Pesquisas</th>
            </tr>
          </thead>
          <tbody>
            {(summary || []).map((s: any) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{s.day}</td>
                <td className="px-4 py-3 text-ink-2">{s.menu_opens}</td>
                <td className="px-4 py-3 text-ink-2">{s.unique_sessions}</td>
                <td className="px-4 py-3 text-ink-2">{s.product_views}</td>
                <td className="px-4 py-3 text-ink-2">{s.searches}</td>
              </tr>
            ))}
            {!summary?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-2">
                  Sem resumos agregados ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-2">
        Dados anónimos. Sem cookies, sem geolocalização, sem fingerprint. Agregação diária prevista para 02:00 Africa/Luanda.
      </p>
    </div>
  );
}
