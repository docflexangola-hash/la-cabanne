'use client';

import { useState } from 'react';

const TYPES = [
  { value: 'compliment', label: 'Elogio' },
  { value: 'suggestion', label: 'Sugestão' },
  { value: 'complaint', label: 'Reclamação' },
  { value: 'other', label: 'Outro' },
] as const;

export function FeedbackForm({ sourcePath }: { sourcePath?: string }) {
  const [type, setType] = useState<'compliment' | 'suggestion' | 'complaint' | 'other'>('suggestion');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          rating,
          comment,
          name: name || undefined,
          contact: contact || undefined,
          website,
          elapsed: Date.now() - startedAt,
          source_path: sourcePath,
        }),
      });

      if (res.ok) {
        setStatus('ok');
        setComment('');
        setName('');
        setContact('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  if (status === 'ok') {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center">
        <p className="font-display text-xl text-deep">Obrigado pelo feedback</p>
        <p className="mt-2 text-sm text-ink-2">A sua mensagem foi recebida com sucesso.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base">
          <span className="text-ink">Tipo</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-line px-3 py-2"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-base">
          <span className="text-ink">Classificação (1-5)</span>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-lg border border-line px-3 py-2"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 text-base">
        <span className="text-ink">Comentário (obrigatório, 10-2000 caracteres)</span>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-line px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base">
          <span className="text-ink">Nome (opcional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="space-y-2 text-base">
          <span className="text-ink">Contacto (opcional)</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={120}
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
      </div>

      {/* Honeypot */}
      <label className="hidden">
        <span>Website</span>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </label>

      <p className="text-xs text-ink-2">
        Ao enviar, concorda com a{' '}
        <a href="/privacidade" className="underline hover:text-blue">
          Política de Privacidade
        </a>
        .
      </p>

      {status === 'error' ? (
        <p className="text-sm text-red-600">Ocorreu um erro. Tente novamente.</p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-lg bg-deep px-4 py-2 text-sm text-ivory disabled:opacity-60"
      >
        {status === 'submitting' ? 'A enviar...' : 'Enviar feedback'}
      </button>
    </form>
  );
}
