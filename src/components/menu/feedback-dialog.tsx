'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

import { FeedbackForm } from '@/components/menu/feedback-form';

export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 sm:items-center"
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-deep/40"
        onClick={onClose}
      />
      <div
        role="document"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
              Ajude-nos a melhorar !
            </p>
            <h2 id="feedback-title" className="mt-1 font-display text-xl text-deep">
              Fale sobre o nosso atendimento
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-deep"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="max-h-[80dvh] overflow-y-auto px-6 py-5">
          <FeedbackForm sourcePath="/" />
        </div>
      </div>
    </div>
  );
}
