import { isPublishableKey } from '@gog/data/client';
import { z } from 'zod';

/**
 * Environment is validated once, at import, on the server. Client components never import this
 * module: whatever they need arrives as props from a server component.
 */

export type DataSourceConfig =
  { source: 'fixtures' } | { source: 'supabase'; url: string; anonKey: string };

export interface Env {
  /** Public origin without a trailing slash, e.g. `https://example.com`. */
  siteUrl: string;
  data: DataSourceConfig;
  iosAppId: string | null;
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  appleTeamId: string | null;
  iosBundleId: string | null;
  androidPackage: string | null;
  androidSha256Fingerprints: string[];
}

const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
/** The anon key is the only Supabase key the website may hold (ADR 0004, 0011). */
const optionalPublishableKey = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(1)
    .refine(isPublishableKey, {
      message:
        'holds a service-role or user token; the website takes only the anon/publishable key (ADR 0011)',
    })
    .optional(),
);

const RawEnvSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  VERCEL_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['production', 'preview', 'development']).optional(),
  ),
  GOG_DATA_SOURCE: z.preprocess(
    emptyToUndefined,
    z.enum(['supabase', 'fixtures']).default('supabase'),
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalPublishableKey,
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_IOS_APP_ID: optionalString,
  NEXT_PUBLIC_APP_STORE_URL: optionalUrl,
  NEXT_PUBLIC_PLAY_STORE_URL: optionalUrl,
  APPLE_TEAM_ID: optionalString,
  IOS_BUNDLE_ID: optionalString,
  ANDROID_PACKAGE: optionalString,
  ANDROID_SHA256_FINGERPRINTS: optionalString,
});

const LOCAL_SITE_URL = 'http://localhost:3000';

export class EnvError extends Error {
  constructor(message: string) {
    super(`Invalid environment for @gog/web: ${message}`);
    this.name = 'EnvError';
  }
}

function dataSource(
  raw: z.infer<typeof RawEnvSchema>,
  isProductionDeployment: boolean,
): DataSourceConfig {
  switch (raw.GOG_DATA_SOURCE) {
    case 'fixtures': {
      if (isProductionDeployment) {
        throw new EnvError('GOG_DATA_SOURCE=fixtures is refused on the production deployment');
      }
      return { source: 'fixtures' };
    }
    case 'supabase': {
      if (!raw.NEXT_PUBLIC_SUPABASE_URL || !raw.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new EnvError(
          'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required when GOG_DATA_SOURCE=supabase (set GOG_DATA_SOURCE=fixtures to run without a backend)',
        );
      }
      return {
        source: 'supabase',
        url: raw.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };
    }
  }
}

/**
 * `next build` runs with NODE_ENV=production everywhere, including `GOG_DATA_SOURCE=fixtures pnpm
 * --filter @gog/web build` on a clean clone, so only the production deployment itself demands the
 * public origin. (Previews could derive `https://${VERCEL_URL}`; deployment is deferred, spec 01.)
 */
function siteUrl(raw: z.infer<typeof RawEnvSchema>, isProductionDeployment: boolean): string {
  const configured = raw.NEXT_PUBLIC_SITE_URL;
  if (!configured) {
    if (isProductionDeployment) {
      throw new EnvError(
        'NEXT_PUBLIC_SITE_URL is required on the production deployment (NODE_ENV and VERCEL_ENV both production)',
      );
    }
    return LOCAL_SITE_URL;
  }
  return configured.replace(/\/+$/, '');
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = RawEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvError(z.prettifyError(parsed.error));
  }
  const raw = parsed.data;
  // The production deployment only: NODE_ENV and VERCEL_ENV both `production`.
  const isProductionDeployment = raw.NODE_ENV === 'production' && raw.VERCEL_ENV === 'production';

  return {
    siteUrl: siteUrl(raw, isProductionDeployment),
    data: dataSource(raw, isProductionDeployment),
    iosAppId: raw.NEXT_PUBLIC_IOS_APP_ID ?? null,
    appStoreUrl: raw.NEXT_PUBLIC_APP_STORE_URL ?? null,
    playStoreUrl: raw.NEXT_PUBLIC_PLAY_STORE_URL ?? null,
    appleTeamId: raw.APPLE_TEAM_ID ?? null,
    iosBundleId: raw.IOS_BUNDLE_ID ?? null,
    androidPackage: raw.ANDROID_PACKAGE ?? null,
    androidSha256Fingerprints: (raw.ANDROID_SHA256_FINGERPRINTS ?? '')
      .split(',')
      .map((fingerprint) => fingerprint.trim())
      .filter((fingerprint) => fingerprint.length > 0),
  };
}

export const env: Env = parseEnv(process.env);
