import type { Metadata } from 'next';

import { requireStaff } from '@/lib/auth/guard';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { FeedbackInbox } from '@/components/admin/feedback-inbox';

export const metadata: Metadata = { title: 'Feedback' };
export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  await requireStaff();

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        <p className="font-display text-2xl text-deep">Supabase não configurado</p>
        <p className="mt-2 text-sm text-ink-2">
          Configure as variáveis de ambiente para aceder à caixa de entrada de feedback.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: feedback } = await supabase
    .from('customer_feedback')
    .select('id, type, rating, comment, name, contact, status, source_path, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Fase 5
        </p>
        <h1 className="font-display text-3xl text-deep">Feedback</h1>
        <p className="max-w-2xl text-sm text-ink-2">
          Caixa de entrada privada com elogios, sugestões e reclamações.
        </p>
      </header>

      <FeedbackInbox items={feedback || []} />
    </div>
  );
}
