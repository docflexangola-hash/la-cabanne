'use client';

import { AtSign, Mail, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { getHoursRows, getOpenState, getTodayKey } from '@/lib/menu/hours';
import { cn } from '@/lib/utils';
import type { RestaurantSettings } from '@/types/menu';

function InstagramLink({ value }: { value: string }) {
  const handle = value
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');

  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-11 items-center gap-3 text-sm text-ink-2 transition-colors hover:text-strong"
    >
      <AtSign aria-hidden="true" className="size-4 shrink-0 text-decor" />
      <span>@{handle}</span>
    </a>
  );
}

export function InfoDialog({
  settings,
  onClose,
}: {
  settings: RestaurantSettings;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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

  const { t, locale } = useTranslation();
  const openState = getOpenState(settings, new Date(), locale);
  const hoursRows = getHoursRows(settings.hours, locale);
  const hasHours = hoursRows.some((row) => !row.closed);
  const todayKey = getTodayKey();

  const whatsappDigits = settings.whatsapp?.replace(/[^\d]/g, '') ?? '';

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="menu-sheet"
      aria-labelledby="info-title"
      onClick={handleBackdropClick}
    >
      <div className="menu-sheet-panel relative max-w-[440px] overflow-y-auto bg-surface">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={t('close_info')}
          className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-hero-fg/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-hero-fg"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div className="flex flex-col items-start gap-3 bg-deep px-6 pt-8 pb-7">
          <Image
            src="/brand/02-logo-mono-claro.png"
            alt="La Cabanne"
            width={1200}
            height={416}
            className="h-7 w-auto"
            sizes="200px"
          />
          <p className="text-[10px] font-medium tracking-[0.22em] text-hero-fg/60 uppercase">
            {t('menu_digital')} · Benguela
          </p>

          {openState ? (
            <p className="mt-1 flex items-center gap-2 text-xs text-hero-fg/85">
              <span
                aria-hidden="true"
                className={cn(
                  'size-1.5 rounded-full',
                  openState.open ? 'bg-emerald-300' : 'bg-ivory/40',
                )}
              />
              {openState ? (openState.open ? t('aberto') : t('fechado')) : null}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-5">
          <h2 id="info-title" className="sr-only">
            {t('info_title')} {settings.name}
          </h2>

          {settings.infoMessage ? (
            <p className="mb-5 text-sm leading-relaxed text-ink-2">{settings.infoMessage}</p>
          ) : null}

          {settings.address ? (
            <p className="flex items-start gap-3 py-2 text-sm leading-relaxed text-ink-2">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-decor" />
              <span>{settings.address}</span>
            </p>
          ) : null}

          {settings.phone ? (
            <a
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
              className="flex min-h-11 items-center gap-3 text-sm text-ink-2 transition-colors hover:text-strong"
            >
              <Phone aria-hidden="true" className="size-4 shrink-0 text-decor" />
              <span>{settings.phone}</span>
            </a>
          ) : null}

          {whatsappDigits ? (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-3 text-sm text-ink-2 transition-colors hover:text-strong"
            >
              <MessageCircle aria-hidden="true" className="size-4 shrink-0 text-decor" />
              <span>{settings.whatsapp}</span>
            </a>
          ) : null}

          {settings.email ? (
            <a
              href={`mailto:${settings.email}`}
              className="flex min-h-11 items-center gap-3 text-sm text-ink-2 transition-colors hover:text-strong"
            >
              <Mail aria-hidden="true" className="size-4 shrink-0 text-decor" />
              <span>{settings.email}</span>
            </a>
          ) : null}

          {settings.instagram ? <InstagramLink value={settings.instagram} /> : null}

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-2 uppercase">
              {t('horario')}
            </p>

            {hasHours ? (
              <dl className="mt-2 space-y-1.5">
                {hoursRows.map((row) => (
                  <div
                    key={row.key}
                    className={cn(
                      'flex items-baseline justify-between gap-4 text-sm',
                      row.key === todayKey ? 'font-medium text-ink' : 'text-ink-2',
                    )}
                  >
                    <dt className="flex items-center gap-2">
                      {row.key === todayKey ? (
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-blue" />
                      ) : null}
                      {row.label}
                    </dt>
                    <dd className="tabular">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-ink-2">{t('hours_tbc')}</p>
            )}
          </div>

          {!settings.address &&
          !settings.phone &&
          !settings.whatsapp &&
          !settings.email &&
          !settings.instagram &&
          !hasHours &&
          !settings.infoMessage ? (
            <p className="mt-5 text-xs leading-relaxed text-decor">{t('info_soon')}</p>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
