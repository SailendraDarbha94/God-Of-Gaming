import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

type RemotePattern = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number];

/** An unset or blank variable means "absent", as in src/lib/env.ts. */
function read(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

class PartnerConfigError extends Error {
  constructor(message: string) {
    super(`Refusing to load the @gog/partner config: ${message}`);
    this.name = 'PartnerConfigError';
  }
}

/**
 * The rule of packages/data/src/publishable-key.ts, repeated here because module resolution in
 * next.config.ts is limited (node_modules/next/dist/docs/01-app/03-api-reference/05-config/02-typescript.md):
 * `sb_secret_` anywhere in the value, or a JWT whose payload cannot be read or carries a `role` other
 * than `anon`, whether it is the whole value or sits inside other text (a quoted or `Bearer ` paste),
 * is a secret. A JWT's header and payload both start with `eyJ`; every JWT in the value is judged, so
 * a paste of both legacy keys cannot hide the service_role one behind the anon one, and a publishable
 * key has no dot, so it cannot match by chance. The reason never includes the key (it may be logged).
 */
function jwtReason(token: string): string | null {
  const payload = token.split('.')[1];
  if (payload === undefined) {
    return 'holds a JWT whose payload cannot be read';
  }
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  let role: unknown;
  try {
    const claims: unknown = JSON.parse(
      atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')),
    );
    role = typeof claims === 'object' && claims !== null && 'role' in claims ? claims.role : null;
  } catch {
    return 'holds a JWT whose payload cannot be read';
  }
  if (typeof role !== 'string') {
    return 'holds a JWT whose payload cannot be read';
  }
  return role === 'anon' ? null : `holds a JWT with role "${role}"`;
}

function secretKeyReason(key: string): string | null {
  if (key.includes('sb_secret_')) {
    return 'holds an sb_secret_ key';
  }
  if (key.startsWith('eyJ')) {
    const whole = jwtReason(key);
    if (whole !== null) {
      return whole;
    }
  }
  for (const [token] of key.matchAll(/eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*/g)) {
    const reason = jwtReason(token);
    if (reason !== null) {
      return reason;
    }
  }
  return null;
}

/**
 * What src/lib/env.ts accepts for a URL, Zod's `z.url({ protocol: /^https?$/ })` (zod 4.6.7): after
 * trimming, the value starts with `http://` or `https://` in any case, and the WHATWG parser reads
 * it. Zod demands the `//`, so `https:example.com`, which the parser would read, is refused too.
 */
function httpUrl(name: string, value: string): URL {
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value);
    } catch {
      // Falls through to the refusal below.
    }
  }
  throw new PartnerConfigError(
    `${name} is not an http or https URL, as src/lib/env.ts requires (it would build, then fail in every browser)`,
  );
}

interface CheckedEnvironment {
  /** The Supabase project's URL, for the CSP and the image host; `null` when none is set. */
  supabase: URL | null;
  fixtures: boolean;
}

/**
 * The build-time gate (docs/spec/09-partner-app.md, Data access, sign-in and session). Next inlines
 * NEXT_PUBLIC_* values into the static client chunks when it builds, so a check that ran only in the
 * browser would refuse a secret key after it had been served from /_next/static. This runs when the
 * config loads (`next dev`, `build`, `start` and `typegen`), before anything is bundled.
 *
 * - Whenever NEXT_PUBLIC_SUPABASE_ANON_KEY is set, whatever the data source, a secret key is refused.
 * - Whenever NEXT_PUBLIC_GOG_DATA_SOURCE, NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_WEBSITE_URL is set,
 *   it must be a value src/lib/env.ts accepts: a deployment with any other value would build and then
 *   fail in every browser.
 * - Only on Vercel (VERCEL_ENV set): fixtures are refused on the production deployment, and a
 *   Supabase source needs the URL and the key. Local builds, `next typegen`, the smoke test's
 *   `next start` and CI's lint, typecheck and test step run without VERCEL_ENV, so a clean clone's
 *   `pnpm check` passes; src/lib/env.ts still refuses a Supabase source without them in the browser.
 *
 * scripts/check-build-gate.sh proves every rule, case by case, through `next typegen`.
 */
function checkEnvironment(): CheckedEnvironment {
  const sourceValue = read(process.env.NEXT_PUBLIC_GOG_DATA_SOURCE);
  const url = read(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = read(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const websiteUrl = read(process.env.NEXT_PUBLIC_WEBSITE_URL);
  const vercelEnv = read(process.env.VERCEL_ENV);

  if (key !== undefined) {
    const reason = secretKeyReason(key);
    if (reason !== null) {
      throw new PartnerConfigError(
        `NEXT_PUBLIC_SUPABASE_ANON_KEY ${reason}; the partner app takes only the anon/publishable key, never the service-role key, because the value is bundled into public JavaScript (ADR 0011)`,
      );
    }
  }

  if (sourceValue !== undefined && sourceValue !== 'supabase' && sourceValue !== 'fixtures') {
    throw new PartnerConfigError(
      'NEXT_PUBLIC_GOG_DATA_SOURCE must be "supabase" or "fixtures" (lower case), or unset for supabase',
    );
  }
  const source = sourceValue ?? 'supabase';
  const supabase = url === undefined ? null : httpUrl('NEXT_PUBLIC_SUPABASE_URL', url);
  if (websiteUrl !== undefined) {
    httpUrl('NEXT_PUBLIC_WEBSITE_URL', websiteUrl);
  }

  if (vercelEnv !== undefined) {
    if (vercelEnv === 'production' && source === 'fixtures') {
      throw new PartnerConfigError(
        'NEXT_PUBLIC_GOG_DATA_SOURCE=fixtures is refused on the production deployment (VERCEL_ENV=production); set supabase with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      );
    }
    if (source === 'supabase' && (url === undefined || key === undefined)) {
      throw new PartnerConfigError(
        `NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required on Vercel (VERCEL_ENV=${vercelEnv}) when NEXT_PUBLIC_GOG_DATA_SOURCE is supabase`,
      );
    }
  }
  return { supabase, fixtures: source === 'fixtures' };
}

/** Cafe photos come from Supabase Storage's public bucket, or from picsum.photos on fixtures. */
function remotePatterns({ supabase, fixtures }: CheckedEnvironment): RemotePattern[] {
  const patterns: RemotePattern[] = [];
  if (fixtures) {
    patterns.push({ protocol: 'https', hostname: 'picsum.photos', pathname: '/seed/**' });
  }
  if (supabase !== null) {
    patterns.push({
      protocol: supabase.protocol === 'http:' ? 'http' : 'https',
      hostname: supabase.hostname,
      port: supabase.port,
      pathname: '/storage/v1/object/public/**',
    });
  }
  return patterns;
}

/**
 * The Content-Security-Policy of docs/spec/09-partner-app.md, Security headers. Nonces would need
 * dynamic rendering, which this app avoids, so scripts keep 'unsafe-inline'; development adds
 * 'unsafe-eval' for React's debugging (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 */
function contentSecurityPolicy(
  { supabase, fixtures }: CheckedEnvironment,
  isDevelopment: boolean,
): string {
  const supabaseSource = supabase === null ? [] : [supabase.origin];
  const directives: [string, string[]][] = [
    ['default-src', ["'self'"]],
    ['script-src', ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])]],
    ['style-src', ["'self'", "'unsafe-inline'"]],
    [
      'img-src',
      [
        "'self'",
        'data:',
        'blob:',
        ...supabaseSource,
        ...(fixtures ? ['https://picsum.photos'] : []),
      ],
    ],
    ['connect-src', ["'self'", ...supabaseSource]],
    ['font-src', ["'self'"]],
    ['object-src', ["'none'"]],
    ['base-uri', ["'none'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ];
  return directives.map(([name, sources]) => `${name} ${sources.join(' ')}`).join('; ');
}

export default function config(phase: string): NextConfig {
  const environment = checkEnvironment();
  const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    // geolocation for "Use my location" on the listing; camera stays off unless M6 needs it.
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    // Nothing here is for search engines (ADR 0013); robots.ts and the root metadata say so too.
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    {
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy(environment, phase === PHASE_DEVELOPMENT_SERVER),
    },
  ];

  return {
    // Workspace packages ship TypeScript source (no build step), so Next compiles them.
    transpilePackages: ['@gog/domain', '@gog/data'],
    // Statically typed `href`s; the route types are written by `next typegen`, `dev` and `build`.
    typedRoutes: true,
    images: {
      remotePatterns: remotePatterns(environment),
    },
    headers() {
      return Promise.resolve([{ source: '/(.*)', headers: securityHeaders }]);
    },
  };
}
