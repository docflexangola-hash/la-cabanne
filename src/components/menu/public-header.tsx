'use client';

import { Info, Moon, Sun } from 'lucide-react';

import { BrandLogo } from '@/components/menu/brand-logo';
import { useTheme } from '@/lib/theme/theme-context';
import { InfoDialog } from '@/components/menu/info-dialog';
import { useTranslation } from '@/lib/i18n/i18n-context';
import type { RestaurantSettings } from '@/types/menu';
import { useState } from 'react';

export function PublicHeader({
  settings,
}: {
  settings?: RestaurantSettings | null;
}) {
  const { preference, resolved, toggle: toggleTheme } = useTheme();
  const { locale, toggle: toggleLang, t } = useTranslation();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <BrandLogo priority dark={resolved === 'dark'} />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="flex h-9 items-center gap-1 rounded-full px-2 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-deep"
            >
              {resolved === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
              <span className="hidden sm:inline">
                {preference === 'auto' ? t('theme_auto') : resolved === 'dark' ? t('theme_dark') : t('theme_light')}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleLang}
              aria-label="Alternar idioma"
              className="flex h-9 items-center rounded-full px-2 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-deep"
            >
              {locale === 'pt' ? t('lang_en') : t('lang_pt')}
            </button>

            {settings ? (
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label={t('info_aria')}
                className="flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-deep"
              >
                <Info aria-hidden="true" className="size-5" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {infoOpen && settings ? (
        <InfoDialog settings={settings} onClose={() => setInfoOpen(false)} />
      ) : null}
    </>
  );
}
