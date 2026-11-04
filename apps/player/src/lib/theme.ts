import type { TextStyle } from 'react-native';

import palette from './palette.json';

/**
 * Design tokens for the player app (spec 06; ADR 0007 keeps UI per app). Dark, high contrast, one
 * accent. The colours mirror the website's `@theme` in apps/web/src/app/globals.css (spec 06) and
 * live in `palette.json` because `app.config.ts` and `scripts/make-assets.mjs` (both evaluated by
 * Node, which cannot load TypeScript modules) need them for the icon, splash and native
 * backgrounds. When the two apps need to share them, a plain JSON tokens package is the next step
 * (ADR 0007).
 */

export const colors = {
  background: palette.background,
  surface: palette.surface,
  surfaceRaised: palette.surfaceRaised,
  border: palette.border,
  text: palette.text,
  textMuted: palette.textMuted,
  // 5.7:1 on background and 5.3:1 on surface (AA for placeholders and hints); #6E6E80 was 3.9:1.
  textSubtle: '#8A8A9E',
  accent: palette.accent,
  onAccent: palette.background,
  success: '#3DDC97',
  warning: '#FFB84D',
  danger: '#FF6B6B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typeScale = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;

/** Minimum size of anything a finger has to hit. */
export const touchTarget = 44;
