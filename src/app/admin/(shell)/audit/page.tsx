import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Histórico' };
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder ao histórico de alterações.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, actor_email, actor_role, entity_type, entity_id, action, summary, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Fase 3
        </p>
        <h1 className="font-display text-3xl text-deep">Histórico de alterações</h1>
        <p className="max-w-2xl text-sm text-ink-2">
          Registo auditável de quem alterou o quê e quando.
        </p>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-medium text-ink-2">Data</th>
              <th className="px-4 py-3 font-medium text-ink-2">Utilizador</th>
              <th className="px-4 py-3 font-medium text-ink-2">Entidade</th>
              <th className="px-4 py-3 font-medium text-ink-2">Acção</th>
              <th className="px-4 py-3 font-medium text-ink-2">Resumo</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).map((log) => (
              <tr key={log.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink-2">
                  {new Date(log.created_at).toLocaleString('pt-PT')}
                </td>
                <td className="px-4 py-3">
                  <div className="text-ink">{log.actor_email || '—'}</div>
                  <div className="text-xs text-ink-2">{log.actor_role || ''}</div>
                </td>
                <td className="px-4 py-3 text-ink-2">
                  {log.entity_type}
                  {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
                </td>
                <td className="px-4 py-3 text-ink">{log.action}</td>
                <td className="px-4 py-3 text-ink-2">{log.summary || '—'}</td>
              </tr>
            ))}
            {!logs?.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink-2">
                  Ainda não há registos de auditoria.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
