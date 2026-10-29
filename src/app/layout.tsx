import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import Script from 'next/script';

import { getSiteUrl } from '@/lib/env';
import { I18nProvider } from '@/lib/i18n/i18n-context';

import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const siteUrl = getSiteUrl();

const title = 'La Cabanne — Menu Digital · Benguela';
const description =
  'Consulte o cardápio do La Cabanne: refeições, sushi e bebidas, com preços em kwanzas. Restaurante e lounge em Benguela.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · La Cabanne',
  },
  description,
  applicationName: 'La Cabanne',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    siteName: 'La Cabanne',
    title,
    description,
    url: '/',
    images: [
      {
        url: '/images/05-og-final.jpg',
        width: 1200,
        height: 630,
        alt: 'La Cabanne — menu digital, Benguela',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/images/05-og-final.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#2474B5',
  colorScheme: 'light',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'La Cabanne',
    description,
    url: siteUrl,
    servesCuisine: ['Portuguesa', 'Sushi', 'Bebidas'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Benguela',
      addressCountry: 'AO',
    },
  };

  return (
    <html
      lang="pt-PT"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${dmSans.variable}`}
    >
      <body className="min-h-[100vh] bg-ivory text-ink">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const pref = localStorage.getItem('lc-theme') || 'auto';
                let theme = 'light';
                if (pref === 'dark') theme = 'dark';
                else if (pref === 'light') theme = 'light';
                else {
                  const h = new Date().getHours();
                  theme = (h >= 18 || h < 6) ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', theme);
              } catch {}
            })();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider>{children}</I18nProvider>
        {process.env.NEXT_PUBLIC_VERCEL ? (
          <Script
            src="https://va.vercel-scripts.com/v1/script.debug.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
