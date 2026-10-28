'use client';

import Image from 'next/image';

import { formatKz } from '@/lib/menu/format';
import { getStartingPrice } from '@/lib/menu/pricing';
import { cn } from '@/lib/utils';
import type { MenuProduct } from '@/types/menu';

export function ProductRow({
  product,
  onOpen,
}: {
  product: MenuProduct;
  onOpen: (product: MenuProduct) => void;
}) {
  const { amount, from } = getStartingPrice(product);
  const unavailable = product.status === 'unavailable';
  const priceLabel =
    amount !== null ? `${from ? 'desde ' : ''}${formatKz(amount)}` : product.priceNote;

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      aria-haspopup="dialog"
      aria-label={`Ver detalhes de ${product.name}${
        unavailable ? ', esgotado' : ''
      }. ${priceLabel ?? 'Preço sob consulta'}.`}
      className={cn(
        'group flex w-full items-start gap-3 border-b border-line py-4 text-left transition-colors',
        'hover:bg-[#FBFAF7] focus-visible:bg-blue-tint/50 focus-visible:outline-none',
        unavailable && 'opacity-60',
      )}
    >
      <div className="size-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            width={112}
            height={112}
            sizes="56px"
            className="size-14 object-cover"
          />
        ) : (
          <Image
            src="/images/placeholder.svg"
            alt=""
            width={112}
            height={112}
            sizes="56px"
            className="size-14 object-cover"
          />
        )}
      </div>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px] font-semibold text-ink">{product.name}</span>
            {unavailable ? (
              <span className="shrink-0 rounded-full border border-danger/30 bg-danger/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-danger uppercase">
                Esgotado
              </span>
            ) : null}
          </span>

          <span className="shrink-0 text-right">
            {from ? (
              <span className="mr-1 text-[11px] font-normal text-ink-2">desde</span>
            ) : null}
            <span className="text-[15px] font-semibold text-deep tabular">
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
  );
}
