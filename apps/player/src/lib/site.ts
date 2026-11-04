import { env } from './env';

/** Pages on the showcase website (apps/web) the app links out to. */
export const siteUrls = {
  home: env.siteUrl,
  privacy: new URL('/privacy', env.siteUrl).toString(),
  terms: new URL('/terms', env.siteUrl).toString(),
} as const;
