'use client';

import { useState } from 'react';

import { useTranslation } from '@/lib/i18n/i18n-context';

const TYPE_VALUES = ['compliment', 'suggestion', 'complaint', 'other'] as const;

export function FeedbackForm({ sourcePath }: { sourcePath?: string }) {
  const { t } = useTranslation();
  const [type, setType] = useState<(typeof TYPE_VALUES)[number]>('suggestion');
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
        <p className="font-display text-xl text-strong">{t('fb_thanks')}</p>
        <p className="mt-2 text-sm text-ink-2">{t('fb_thanks_body')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base">
          <span className="text-ink">{t('fb_type')}</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2"
          >
            {TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {t(`fb_${value}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-base">
          <span className="text-ink">{t('fb_rating')}</span>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2"
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
        <span className="text-ink">{t('fb_comment')}</span>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-line bg-surface px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-base">
          <span className="text-ink">{t('fb_name')}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2"
          />
        </label>
        <label className="space-y-2 text-base">
          <span className="text-ink">{t('fb_contact')}</span>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={120}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2"
          />
        </label>
      </div>

      {/* Honeypot */}
      <label className="hidden">
        <span>Website</span>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </label>

      <p className="text-xs text-ink-2">
        {t('fb_privacy_prefix')}{' '}
        <a href="/privacidade" className="underline hover:text-blue">
          {t('fb_privacy_link')}
        </a>
        .
      </p>

      {status === 'error' ? (
        <p className="text-sm text-red-600">{t('fb_error')}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-lg bg-deep px-4 py-2 text-sm text-hero-fg disabled:opacity-60"
      >
        {status === 'submitting' ? t('fb_sending') : t('fb_submit')}
      </button>
    </form>
  );
}
