'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent } from 'react';

import { MonogramPlaceholder } from '@/components/menu/monogram-placeholder';
import { formatKz } from '@/lib/menu/format';
import { getSelectedPrice } from '@/lib/menu/pricing';
import { cn } from '@/lib/utils';
import type { MenuProduct } from '@/types/menu';

export function ProductDialog({
  product,
  onClose,
}: {
  product: MenuProduct;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const unavailable = product.status === 'unavailable';

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      product.variantGroups.map((group) => [group.id, group.variants[0]?.id ?? '']),
    ),
  );

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

  const price = getSelectedPrice(product, selection);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="menu-sheet"
      aria-labelledby={`product-title-${product.id}`}
      onClick={handleBackdropClick}
    >
      <div className="menu-sheet-panel relative grid bg-surface lg:grid-cols-2">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fechar detalhe do produto"
          className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full border border-line bg-white/90 text-ink-2 backdrop-blur transition-colors hover:text-deep"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div className="relative aspect-[16/10] overflow-hidden bg-sand lg:aspect-auto lg:h-full lg:min-h-[420px]">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 440px, 100vw"
              className="object-cover"
            />
          ) : (
            <Image
              src="/images/placeholder.svg"
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 440px, 100vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          <h2
            id={`product-title-${product.id}`}
            className="pr-10 font-display text-[34px] leading-[1.1] text-deep"
          >
            {product.name}
          </h2>

          {product.description ? (
            <p className="mt-3 text-[15px] leading-[1.55] text-ink-2">{product.description}</p>
          ) : null}

          {product.serves ? (
            <p className="mt-2 text-xs text-ink-2">Serve {product.serves}</p>
          ) : null}

          {unavailable ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-danger/25 bg-danger/5 px-3 py-2 text-sm text-danger"
            >
              Esgotado neste momento.
            </p>
          ) : null}

          {product.variantGroups.map((group) => {
            const selectedId = selection[group.id] ?? group.variants[0]?.id ?? '';

            return (
              <fieldset key={group.id} className="mt-5">
                <legend className="text-[11px] font-semibold tracking-[0.14em] text-ink-2 uppercase">
                  {group.name}
                </legend>

                <div className="mt-2 flex flex-wrap gap-2">
                  {group.variants.map((variant) => {
                    const active = variant.id === selectedId;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setSelection((current) => ({ ...current, [group.id]: variant.id }))
                        }
                        className={cn(
                          'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
                          active
                            ? 'border-deep bg-deep text-white'
                            : 'border-line text-ink-2 hover:border-deep hover:text-deep',
                        )}
                      >
                        <span>{variant.name}</span>
                        <span
                          className={cn(
                            'text-xs tabular',
                            active ? 'text-white/80' : 'text-ink-2',
                          )}
                        >
                          {formatKz(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="text-xs text-ink-2">Preço</span>
            <span className="font-display text-2xl text-deep tabular">
              {price !== null ? formatKz(price) : (product.priceNote ?? 'Sob consulta')}
            </span>
          </div>

          {product.allergens.length > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-2">
              <span className="font-medium text-ink">Alergénios:</span>{' '}
              {product.allergens.join(', ')}.
            </p>
          ) : null}

          <p className="mt-6 text-[11px] leading-relaxed text-decor">
            Preço com IVA incluído. Consulte a equipa para informação sobre alergénios.
          </p>
        </div>
      </div>
    </dialog>
  );
}
