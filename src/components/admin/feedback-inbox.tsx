'use client';

import { useState } from 'react';

type FeedbackItem = {
  id: string;
  type: 'compliment' | 'suggestion' | 'complaint' | 'other';
  rating: number;
  comment: string;
  name: string | null;
  contact: string | null;
  status: 'new' | 'in_review' | 'resolved' | 'archived';
  source_path: string | null;
  created_at: string;
};

const TYPE_LABEL: Record<FeedbackItem['type'], string> = {
  compliment: 'Elogio',
  suggestion: 'Sugestão',
  complaint: 'Reclamação',
  other: 'Outro',
};

const STATUS_LABEL: Record<FeedbackItem['status'], string> = {
  new: 'Novo',
  in_review: 'Em análise',
  resolved: 'Resolvido',
  archived: 'Arquivado',
};

export function FeedbackInbox({ items }: { items: FeedbackItem[] }) {
  const [filter, setFilter] = useState<'all' | FeedbackItem['status']>('all');

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'new', 'in_review', 'resolved', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              filter === f ? 'bg-deep text-ivory' : 'border border-line text-ink-2'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink">
                    {TYPE_LABEL[item.type]}
                  </span>
                  <span className="text-xs text-ink-2">Avaliação {item.rating}/5</span>
                  <span className="text-xs text-ink-2">{STATUS_LABEL[item.status]}</span>
                </div>
                <p className="mt-2 text-sm text-ink whitespace-pre-wrap">{item.comment}</p>
              </div>
              <div className="text-right text-xs text-ink-2">
                <p>{new Date(item.created_at).toLocaleString('pt-PT')}</p>
                {item.source_path ? <p>{item.source_path}</p> : null}
              </div>
            </div>
            {(item.name || item.contact) ? (
              <div className="mt-3 border-t border-line pt-3 text-xs text-ink-2">
                {item.name ? <p>Nome: {item.name}</p> : null}
                {item.contact ? <p>Contacto: {item.contact}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
        {!filtered.length ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-ink-2">
            Sem feedback neste filtro.
          </div>
        ) : null}
      </div>
    </div>
  );
}
