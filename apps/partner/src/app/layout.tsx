import type { Metadata, Viewport } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import { site } from '@/config/site';

import './globals.css';

/** The brand's display and text faces, self-hosted by next/font (the CSP allows only 'self'). */
const displayFont = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const textFont = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} for cafes`,
    template: `%s · ${site.name} for cafes`,
  },
  description: `The partner dashboard for cafes on ${site.name}.`,
  applicationName: `${site.name} for cafes`,
  // Nothing here is for search engines (ADR 0013): the X-Robots-Tag header and robots.ts agree.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN" className={`${displayFont.variable} ${textFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
