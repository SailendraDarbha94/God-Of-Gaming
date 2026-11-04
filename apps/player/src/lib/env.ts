import { isPublishableKey } from '@gog/data/client';
import { z } from 'zod';

/**
 * Environment validated once at import (ADR 0011). Expo inlines each static `process.env.EXPO_PUBLIC_*`
 * read at bundle time, so every variable is named literally here; `.env.example` documents them.
 * `process.env.NODE_ENV` (like `__DEV__`) is inlined the same way and is `production` in every
 * release bundle (EAS `preview` and `production`, `expo run --configuration Release`, `expo export`,
 * `expo start --no-dev`), which is how release builds refuse `fixtures` (ADR 0012).
 */

const DataSourceSchema = z.enum(['supabase', 'fixtures']);
export type DataSource = z.infer<typeof DataSourceSchema>;

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface Env {
  dataSource: DataSource;
  /** `null` when the app runs on fixtures and never talks to a backend. */
  supabase: SupabaseEnv | null;
  siteUrl: string;
}

const RawEnv = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    EXPO_PUBLIC_DATA_SOURCE: DataSourceSchema.default('supabase'),
    EXPO_PUBLIC_SUPABASE_URL: z.url().optional(),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1)
      .refine(isPublishableKey, {
        message:
          'holds a service-role or user token; the app takes only the anon/publishable key (ADR 0011)',
      })
      .optional(),
    EXPO_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  })
  .superRefine((raw, ctx) => {
    if (raw.EXPO_PUBLIC_DATA_SOURCE === 'fixtures' && raw.NODE_ENV === 'production') {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_DATA_SOURCE'],
        message:
          'fixtures is refused in release builds (ADR 0012); set supabase with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY',
      });
    }
    if (raw.EXPO_PUBLIC_DATA_SOURCE !== 'supabase') {
      return;
    }
    if (raw.EXPO_PUBLIC_SUPABASE_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_SUPABASE_URL'],
        message: 'Required when EXPO_PUBLIC_DATA_SOURCE is "supabase"',
      });
    }
    if (raw.EXPO_PUBLIC_SUPABASE_ANON_KEY === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPO_PUBLIC_SUPABASE_ANON_KEY'],
        message: 'Required when EXPO_PUBLIC_DATA_SOURCE is "supabase"',
      });
    }
  })
  .transform((raw): Env => ({
    dataSource: raw.EXPO_PUBLIC_DATA_SOURCE,
    supabase:
      raw.EXPO_PUBLIC_DATA_SOURCE === 'supabase' &&
      raw.EXPO_PUBLIC_SUPABASE_URL !== undefined &&
      raw.EXPO_PUBLIC_SUPABASE_ANON_KEY !== undefined
        ? { url: raw.EXPO_PUBLIC_SUPABASE_URL, anonKey: raw.EXPO_PUBLIC_SUPABASE_ANON_KEY }
        : null,
    siteUrl: raw.EXPO_PUBLIC_SITE_URL,
  }));

/** An unset or blank variable means "absent", so defaults and "required" checks apply. */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

/** Each `process.env.X` below is a literal static read, which is what Expo's inlining requires. */
export function parseEnv(source: {
  NODE_ENV: string | undefined;
  EXPO_PUBLIC_DATA_SOURCE: string | undefined;
  EXPO_PUBLIC_SUPABASE_URL: string | undefined;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  EXPO_PUBLIC_SITE_URL: string | undefined;
}): Env {
  const result = RawEnv.safeParse({
    NODE_ENV: read(source.NODE_ENV),
    EXPO_PUBLIC_DATA_SOURCE: read(source.EXPO_PUBLIC_DATA_SOURCE),
    EXPO_PUBLIC_SUPABASE_URL: read(source.EXPO_PUBLIC_SUPABASE_URL),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: read(source.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    EXPO_PUBLIC_SITE_URL: read(source.EXPO_PUBLIC_SITE_URL),
  });
  if (!result.success) {
    throw new Error(
      `Invalid environment (see apps/player/.env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const env: Env = parseEnv({
  NODE_ENV: process.env.NODE_ENV,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL,
});
