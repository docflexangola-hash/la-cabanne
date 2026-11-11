'use client';

import { ShoppingBag } from 'lucide-react';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { formatKz } from '@/lib/menu/format';
import { useOrder } from '@/lib/orders/context';
import { getOrderItemCount, getOrderTotal } from '@/lib/orders/totals';

export function OrderFab({ onOpen }: { onOpen: () => void }) {
  const { store, clearToast } = useOrder();
  const { t } = useTranslation();

  const draft = store.draft;
  const count = draft ? getOrderItemCount(draft.items) : 0;
  const total = draft ? getOrderTotal(draft.items) : 0;
  const hasHistory = store.history.length > 0;

  if (!draft && !hasHistory) {
    return null;
  }

  const label =
    count > 0
      ? `${t('order_fab')} · ${count} ${count === 1 ? t('order_item') : t('order_items')} · ${formatKz(total)}`
      : t('order_history');

  return (
    <div className="fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 flex flex-col items-end gap-2 sm:right-4 sm:bottom-4">
      {store.toast ? (
        <div
          key={store.toast.id}
          onAnimationEnd={clearToast}
          className="order-toast max-w-[240px] truncate rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-strong shadow-lg"
        >
          {t('order_added')} · {store.toast.name}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="flex h-14 items-center gap-2 rounded-full bg-deep px-4 text-hero-fg shadow-[0_12px_30px_rgba(18,62,100,0.28)] transition-colors hover:bg-blue-700 active:scale-95"
      >
        <span className="relative">
          <ShoppingBag aria-hidden="true" className="size-5" />
          {count > 0 ? (
            <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-sand text-[11px] font-bold text-deep">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </span>
        {count > 0 ? (
          <span className="hidden text-sm font-semibold tabular sm:inline">
            {formatKz(total)}
          </span>
        ) : null}
      </button>
    </div>
  );
}
