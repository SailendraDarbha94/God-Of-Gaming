import type { NextConfig } from 'next';

type RemotePattern = NonNullable<NonNullable<NextConfig['images']>['remotePatterns']>[number];

/**
 * Cafe and promotion images live in Supabase Storage (public bucket) when the site reads from
 * Supabase, and on picsum.photos when it renders the fixtures (08-sample-data.md). The storage host
 * is derived from the project URL so the config needs no second variable.
 */
function remotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: 'https', hostname: 'picsum.photos', pathname: '/seed/**' },
  ];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const { hostname, protocol } = new URL(supabaseUrl);
    patterns.push({
      protocol: protocol === 'http:' ? 'http' : 'https',
      hostname,
      pathname: '/storage/v1/object/public/**',
    });
  }
  return patterns;
}

/**
 * The site holds no user data (ADR 0004), so these close the remaining gaps: clickjacking of the
 * "Book in the app" page, referrer leakage of cafe URLs to external CTA targets, and MIME sniffing.
 * A Content-Security-Policy follows once the Supabase storage host is known (the JSON-LD script
 * needs `'unsafe-inline'` or a nonce). Vercel adds HSTS itself.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source (no build step), so Next compiles them.
  transpilePackages: ['@gog/domain', '@gog/data'],
  // Statically typed `href`s; the route types are written by `next typegen`, `dev` and `build`.
  typedRoutes: true,
  images: {
    remotePatterns: remotePatterns(),
  },
  headers() {
    return Promise.resolve([{ source: '/(.*)', headers: SECURITY_HEADERS }]);
  },
};

export default nextConfig;
