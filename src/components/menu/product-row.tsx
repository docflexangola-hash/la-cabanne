'use client';

import { Plus } from 'lucide-react';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { formatKz } from '@/lib/menu/format';
import { getStartingPrice } from '@/lib/menu/pricing';
import { cn } from '@/lib/utils';
import type { MenuProduct } from '@/types/menu';

export function ProductRow({
  product,
  onOpen,
  onQuickAdd,
}: {
  product: MenuProduct;
  onOpen: (product: MenuProduct) => void;
  onQuickAdd?: (product: MenuProduct) => void;
}) {
  const { t } = useTranslation();
  const { amount, from } = getStartingPrice(product);
  const unavailable = product.status === 'unavailable';
  const hasVariants = product.variantGroups.length > 0;
  const canQuickAdd = !unavailable && !hasVariants && product.basePrice !== null;
  const canChooseVariants = !unavailable && hasVariants;
  const priceLabel =
    amount !== null
      ? `${from ? `${t('price_from')} ` : ''}${formatKz(amount)}`
      : product.priceNote;

  return (
    <div
      className={cn(
        'group flex w-full items-start gap-2 border-b border-line py-4 transition-colors',
        'hover:bg-[#FBFAF7]',
        unavailable && 'opacity-60',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(product)}
        aria-haspopup="dialog"
        aria-label={`${t('view_details')} ${product.name}${
          unavailable ? `, ${t('unavailable').toLowerCase()}` : ''
        }. ${priceLabel ?? t('price_on_request')}.`}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px] font-semibold text-ink">
                {product.name}
              </span>
              {unavailable ? (
                <span className="shrink-0 rounded-full border border-danger/30 bg-danger/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-danger uppercase">
                  {t('unavailable')}
                </span>
              ) : null}
            </span>

            <span className="shrink-0 text-right">
              {from ? (
                <span className="mr-1 text-[11px] font-normal text-ink-2">
                  {t('price_from')}
                </span>
              ) : null}
              <span className="text-[15px] font-semibold text-strong tabular">
                {amount !== null ? formatKz(amount) : (product.priceNote ?? '—')}
              </span>
            </span>
          </span>

          {product.description ? (
            <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.45] text-ink-2">
              {product.description}
            </span>
          ) : null}
        </span>
      </button>

      {canQuickAdd && onQuickAdd ? (
        <button
          type="button"
          onClick={() => onQuickAdd(product)}
          aria-label={`${t('order_add')} ${product.name}`}
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-deep hover:bg-deep hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      ) : canChooseVariants ? (
        <button
          type="button"
          onClick={() => onOpen(product)}
          aria-label={`${t('order_add_variant')} ${product.name}`}
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-deep hover:text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
