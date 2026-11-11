'use client';

import {
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { formatKz } from '@/lib/menu/format';
import { useOrder } from '@/lib/orders/context';
import { getOrderItemCount, getOrderTotal } from '@/lib/orders/totals';
import { cn } from '@/lib/utils';

type Tab = 'current' | 'history';

function formatDateTime(value: string, locale: 'pt' | 'en'): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const STATUS_BADGE: Record<'saved' | 'sent', string> = {
  saved: 'border-line bg-surface text-ink-2',
  sent: 'border-ok/30 bg-ok/10 text-ok',
};

export function OrderSheet({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t, locale } = useTranslation();
  const {
    store,
    setQuantity,
    removeItem,
    setTableLabel,
    saveDraft,
    reopenSaved,
    deleteSaved,
    startNewSession,
    sendOrder,
  } = useOrder();

  const [tab, setTab] = useState<Tab>(() => (store.draft ? 'current' : 'history'));
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  );

  const draft = store.draft;
  const draftCount = draft ? getOrderItemCount(draft.items) : 0;
  const draftTotal = draft ? getOrderTotal(draft.items) : 0;
  const hasDraftItems = Boolean(draft && draft.items.length > 0);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);

    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  function handleSave() {
    if (saveDraft()) {
      setNotice({ kind: 'success', text: t('order_saved') });
      setTab('history');
    }
  }

  async function handleSend() {
    setSending(true);
    setNotice(null);

    const localTotal = draftTotal;
    const result = await sendOrder();
    setSending(false);

    if (result.ok) {
      const sentLabel = `${t('order_round')} ${result.roundNumber} · ${t('order_sent')}`;

      setNotice({
        kind: 'success',
        text:
          Math.abs(result.total - localTotal) >= 1
            ? `${sentLabel} · ${t('order_server_total_updated')} ${formatKz(result.total)}`
            : sentLabel,
      });
      setTab('history');
      return;
    }

    setNotice({
      kind: 'error',
      text: result.error === 'empty' ? t('order_empty') : t('order_send_failed'),
    });
  }

  function handleContinue(orderId: string) {
    if (reopenSaved(orderId)) {
      setNotice(null);
      setTab('current');
      return;
    }

    setNotice({ kind: 'error', text: t('order_draft_busy') });
  }

  function handleNewSession() {
    startNewSession();
    setNotice({ kind: 'success', text: t('order_new_session_done') });
    setTab('current');
  }

  return (
    <dialog
      ref={dialogRef}
      className="menu-sheet"
      aria-labelledby="order-sheet-title"
      onClick={handleBackdropClick}
    >
      <div className="menu-sheet-panel relative w-full max-w-[560px] bg-surface">
        <div className="sticky top-0 z-10 border-b border-line bg-surface/95 px-5 pt-4 pb-3 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="order-sheet-title" className="font-display text-2xl text-strong">
                {t('order_title')}
              </h2>
              {hasDraftItems ? (
                <p className="mt-1 text-xs text-ink-2">{t('order_show_waiter')}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t('close')}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-strong"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setTab('current')}
              className={cn(
                'flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
                tab === 'current' ? 'bg-surface text-strong shadow-xs' : 'text-ink-2',
              )}
            >
              {t('order_current')}
              {draftCount > 0 ? ` · ${draftCount}` : ''}
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={cn(
                'flex-1 rounded-lg py-2 text-xs font-medium transition-colors',
                tab === 'history' ? 'bg-surface text-strong shadow-xs' : 'text-ink-2',
              )}
            >
              {t('order_history')}
              {store.history.length > 0 ? ` · ${store.history.length}` : ''}
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          {!store.storageAvailable ? (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-sand-line bg-sand/40 px-3 py-2 text-xs text-ink-2"
            >
              {t('order_storage_unavailable')}
            </p>
          ) : null}

          {notice ? (
            <p
              role={notice.kind === 'error' ? 'alert' : 'status'}
              className={cn(
                'mb-4 rounded-lg border px-3 py-2 text-sm',
                notice.kind === 'error'
                  ? 'border-danger/25 bg-danger/5 text-danger'
                  : 'border-ok/25 bg-ok/5 text-ok',
              )}
            >
              {notice.text}
            </p>
          ) : null}

          {tab === 'current' ? (
            hasDraftItems && draft ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="order-table"
                    className="block text-[11px] font-semibold tracking-[0.14em] text-decor uppercase"
                  >
                    {t('order_table')}
                  </label>
                  <input
                    id="order-table"
                    type="text"
                    inputMode="numeric"
                    maxLength={20}
                    value={draft.tableLabel ?? ''}
                    onChange={(event) => setTableLabel(event.target.value)}
                    disabled={sending}
                    placeholder={t('order_table_placeholder')}
                    className="mt-1 w-32 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  />
                </div>

                <ul className="divide-y divide-line border-y border-line">
                  {draft.items.map((item) => (
                    <li key={item.id} className="flex gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{item.productName}</p>
                        {item.variantLabel ? (
                          <p className="mt-0.5 text-xs text-ink-2">{item.variantLabel}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-ink-2 tabular">
                          {formatKz(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-semibold text-strong tabular">
                          {formatKz(item.unitPrice * item.quantity)}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                            disabled={sending || item.quantity <= 1}
                            aria-label={t('order_decrease')}
                            className="flex size-8 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-strong disabled:opacity-30"
                          >
                            <Minus aria-hidden="true" className="size-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-medium text-ink tabular">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                            disabled={sending}
                            aria-label={t('order_increase')}
                            className="flex size-8 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-strong"
                          >
                            <Plus aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={sending}
                            aria-label={`${t('order_remove')} ${item.productName}`}
                            className="ml-1 flex size-8 items-center justify-center rounded-full text-decor transition-colors hover:text-danger"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold tracking-[0.14em] text-decor uppercase">
                    {t('order_total')}
                  </span>
                  <span className="font-display text-2xl text-strong tabular">
                    {formatKz(draftTotal)}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={sending}
                    className="inline-flex h-11 items-center justify-center rounded-sm border border-line px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 disabled:opacity-60"
                  >
                    {t('order_save')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-deep px-4 text-sm font-medium text-hero-fg transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    ) : null}
                    {sending ? t('order_sending') : t('order_send')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-2 text-ink-2">
                  <ShoppingBag aria-hidden="true" className="size-6" />
                </div>
                <p className="mt-4 font-display text-xl text-strong">{t('order_empty')}</p>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="mt-4 inline-flex h-10 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2"
                >
                  {t('order_back_to_menu')}
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {store.history.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-display text-xl text-strong">{t('order_history_empty')}</p>
                  <button
                    type="button"
                    onClick={() => setTab('current')}
                    className="mt-4 inline-flex h-10 items-center rounded-sm border border-line px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2"
                  >
                    {t('order_current')}
                  </button>
                </div>
              ) : (
                store.history.map((order) => {
                  const count = getOrderItemCount(order.items);
                  const total = order.serverTotal ?? getOrderTotal(order.items);

                  return (
                    <article
                      key={order.id}
                      className="rounded-xl border border-line bg-surface-2/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.14em] text-decor uppercase">
                            {t('order_round')} {order.roundNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-2">
                            {formatDateTime(order.sentAt ?? order.createdAt, locale)}
                            {order.tableLabel ? ` · ${t('order_table_short')} ${order.tableLabel}` : ''}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                            STATUS_BADGE[order.status === 'sent' ? 'sent' : 'saved'],
                          )}
                        >
                          {order.status === 'sent' ? t('order_sent') : t('order_saved')}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-ink-2 tabular">
                        {count} {count === 1 ? t('order_item') : t('order_items')} ·{' '}
                        <span className="font-semibold text-strong">{formatKz(total)}</span>
                      </p>

                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-blue">
                          {t('order_view_items')}
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs text-ink-2">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between gap-3">
                              <span className="min-w-0">
                                {item.quantity}× {item.productName}
                                {item.variantLabel ? ` (${item.variantLabel})` : ''}
                              </span>
                              <span className="shrink-0 tabular">
                                {formatKz(item.unitPrice * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.status === 'saved' ? (
                          <button
                            type="button"
                            onClick={() => handleContinue(order.id)}
                            disabled={hasDraftItems}
                            className="inline-flex h-9 items-center gap-1 rounded-sm bg-deep px-3 text-xs font-medium text-hero-fg transition-colors hover:bg-blue-700 disabled:opacity-40"
                          >
                            <Check aria-hidden="true" className="size-3.5" />
                            {t('order_continue')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteSaved(order.id)}
                          className="inline-flex h-9 items-center rounded-sm border border-line px-3 text-xs font-medium text-ink-2 transition-colors hover:text-danger"
                        >
                          {t('order_delete')}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}

              <div className="border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-deep px-4 text-sm font-medium text-hero-fg transition-colors hover:bg-blue-700"
                >
                  {t('order_add_more')}
                </button>

                <button
                  type="button"
                  onClick={handleNewSession}
                  className="mt-3 text-xs font-medium text-ink-2 underline-offset-2 hover:text-strong hover:underline"
                >
                  {t('order_new_session')}
                </button>
                <p className="mt-1 text-[11px] text-decor">{t('order_new_session_hint')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
