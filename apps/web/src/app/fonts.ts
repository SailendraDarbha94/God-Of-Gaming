import { Manrope, Space_Grotesk } from 'next/font/google';

/** One display face for headings and one text face for everything else (05-web.md, Design). */
export const displayFont = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const textFont = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});
