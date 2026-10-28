import type { Metadata } from 'next';

import { FeedbackForm } from '@/components/menu/feedback-form';
import { getSiteUrl } from '@/lib/env';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Envie sugestões, elogios ou reclamações ao La Cabanne.',
  alternates: {
    canonical: `${siteUrl}/feedback`,
  },
};

export default function FeedbackPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          Opinião dos clientes
        </p>
        <h1 className="font-display text-3xl text-deep">Feedback</h1>
        <p className="text-sm text-ink-2">
          O seu feedback é privado e ajuda-nos a melhorar. Campos obrigatórios marcados.
        </p>
      </header>
      <FeedbackForm sourcePath="/feedback" />
    </main>
  );
}
