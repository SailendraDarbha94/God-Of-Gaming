import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { site } from '@/config/site';
import { env } from '@/lib/env';

import { displayFont, textFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${site.name} · Gaming cafes in ${site.city.name}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  // "Bangalore" is the search synonym for Bengaluru (ADR 0006); copy always says Bengaluru.
  keywords: [
    `gaming cafe ${site.city.name}`,
    `gaming cafe ${site.city.synonym}`,
    `gaming cafe near me ${site.city.name}`,
    `PS5 cafe ${site.city.synonym}`,
    `PC gaming lounge ${site.city.name}`,
    'esports cafe',
    'squad booking gaming cafe',
  ],
  openGraph: { type: 'website', siteName: site.name, locale: 'en_IN' },
  twitter: { card: 'summary' },
  robots: { index: true, follow: true },
  itunes: env.iosAppId ? { appId: env.iosAppId } : null,
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${displayFont.variable} ${textFont.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
