import Link from 'next/link';

import { cn } from '@/lib/utils';

export function PhasePlaceholder({
  title,
  phase,
  description,
  items,
}: {
  title: string;
  phase: string;
  description: string;
  items?: string[];
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-decor uppercase">
          {phase}
        </p>
        <h1 className="font-display text-3xl text-deep">{title}</h1>
        <p className="max-w-2xl text-sm text-ink-2">{description}</p>
      </header>

      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="text-sm font-medium text-ink">Ainda não implementado</p>
        <p className="mt-1 max-w-xl text-sm text-ink-2">
          Esta área faz parte de uma fase posterior do plano. Nenhum dado fictício é
          apresentado até existir conteúdo real.
        </p>

        {items?.length ? (
          <ul className="mt-5 space-y-2">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-2">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue"
                />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Link
        href="/admin/dashboard"
        className={cn(
          'inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink-2',
          'transition-colors hover:border-blue hover:text-blue',
        )}
      >
        Voltar ao dashboard
      </Link>
    </div>
  );
}
