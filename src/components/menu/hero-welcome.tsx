'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTranslation } from '@/lib/i18n/i18n-context';
import { useTheme } from '@/lib/theme/use-theme';

export function HeroWelcome() {
  const { t } = useTranslation();
  const { resolved } = useTheme();
  const imageSrc = resolved === 'dark' ? "/images/la-cabanne/hero-piscina-noturna.webp" : "/images/la-cabanne/hero-piscina-resort.webp";

  return (
    <section className="relative isolate min-h-[78svh] overflow-hidden md:min-h-[88svh]">
      <Image
        src={imageSrc}
        alt={resolved === 'dark' ? "Piscina Noturna do LA CABANE" : "Piscina do Resort La Cabanne ao entardecer"}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f33]/90 via-[#0b1f33]/60 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-[78svh] w-full max-w-[1100px] items-center px-4 sm:px-6 md:min-h-[88svh]">
        <div className="w-full max-w-xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-ivory/90 sm:text-sm">
            {t('bem_vindo_ao')}
          </p>
          <Image
            src="/brand/01-logo-cor.svg"
            alt="La Cabanne"
            width={520}
            height={180}
            className="h-auto w-[min(82vw,420px)] brightness-0 invert drop-shadow-[0_12px_70px_rgba(0,0,0,0.55)] md:w-[520px]"
            priority
          />
          <div className="mt-8">
            <Link
              href="#menu"
              className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-700"
            >
              {t('ver_menu')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
