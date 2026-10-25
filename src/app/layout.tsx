import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { getSiteUrl } from '@/lib/env';

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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-PT"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${dmSans.variable}`}
    >
      <body className="min-h-dvh bg-ivory text-ink">{children}</body>
    </html>
  );
}
