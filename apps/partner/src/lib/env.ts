import { isPublishableKey } from '@gog/data/client';
import { z } from 'zod';

/**
 * The partner app's environment (docs/spec/09-partner-app.md, Data access, sign-in and session),
 * parsed with Zod at import. Only the client-only shell imports it, so it is parsed in the browser;
 * `next.config.ts` checks the same variables at build time, because Next inlines each NEXT_PUBLIC_*
 * value into the static client chunks and a secret found only in the browser would already have
 * been served. Each variable is read below as a literal `process.env.NEXT_PUBLIC_…`, the only form
 * Next inlines (node_modules/next/dist/docs/01-app/02-guides/environment-variables.md).
 */

export type DataSourceConfig =
  { source: 'fixtures' } | { source: 'supabase'; url: string; anonKey: string };

export interface Env {
  data: DataSourceConfig;
  /** The website's origin without a trailing slash, for "View public page"; `null` hides it. */
  websiteUrl: string | null;
}

export interface EnvSource {
  NEXT_PUBLIC_GOG_DATA_SOURCE: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  NEXT_PUBLIC_WEBSITE_URL: string | undefined;
}

const HttpUrl = z.url({ protocol: /^https?$/ });

const RawEnv = z
  .object({
    NEXT_PUBLIC_GOG_DATA_SOURCE: z.enum(['supabase', 'fixtures']).default('supabase'),
    NEXT_PUBLIC_SUPABASE_URL: HttpUrl.optional(),
    /** The anon (publishable) key is the only Supabase key the partner app may hold (ADR 0011). */
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .refine(isPublishableKey, {
        message:
          'holds a service-role or user token; the partner app takes only the anon/publishable key (ADR 0011)',
      })
      .optional(),
    NEXT_PUBLIC_WEBSITE_URL: HttpUrl.optional(),
  })
  .superRefine((raw, ctx) => {
    if (raw.NEXT_PUBLIC_GOG_DATA_SOURCE !== 'supabase') {
      return;
    }
    for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const) {
      if (raw[name] === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message:
            'Required when NEXT_PUBLIC_GOG_DATA_SOURCE is "supabase" (set it to "fixtures" to run without a backend)',
        });
      }
    }
  });

export class EnvError extends Error {
  constructor(message: string) {
    super(`Invalid environment for @gog/partner (see apps/partner/.env.example):\n${message}`);
    this.name = 'EnvError';
  }
}

/** An unset or blank variable means "absent", so defaults and "required" checks apply. */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

export function parseEnv(source: EnvSource): Env {
  const result = RawEnv.safeParse({
    NEXT_PUBLIC_GOG_DATA_SOURCE: read(source.NEXT_PUBLIC_GOG_DATA_SOURCE),
    NEXT_PUBLIC_SUPABASE_URL: read(source.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: read(source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_WEBSITE_URL: read(source.NEXT_PUBLIC_WEBSITE_URL),
  });
  if (!result.success) {
    throw new EnvError(z.prettifyError(result.error));
  }
  const raw = result.data;
  const websiteUrl = raw.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/+$/, '') ?? null;
  if (raw.NEXT_PUBLIC_GOG_DATA_SOURCE === 'fixtures') {
    return { data: { source: 'fixtures' }, websiteUrl };
  }
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = raw;
  if (url === undefined || anonKey === undefined) {
    // Unreachable: the refinement above reports both as missing.
    throw new EnvError('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
  }
  return { data: { source: 'supabase', url, anonKey }, websiteUrl };
}

export const env: Env = parseEnv({
  NEXT_PUBLIC_GOG_DATA_SOURCE: process.env.NEXT_PUBLIC_GOG_DATA_SOURCE,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
});
