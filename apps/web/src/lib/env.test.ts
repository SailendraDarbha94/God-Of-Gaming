import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv } from '@/lib/env';

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Built, not pasted, so no `eyJ…` literal sits in the tree for the secret scan to find. */
const SERVICE_ROLE_KEY = `${base64Url('{"alg":"HS256","typ":"JWT"}')}.${base64Url(
  '{"iss":"supabase-demo","role":"service_role","exp":1983812996}',
)}.signature`;

const SUPABASE = {
  GOG_DATA_SOURCE: 'supabase',
  NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefgh.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_x',
};

describe('parseEnv', () => {
  describe('site URL', () => {
    it('defaults to localhost in development', () => {
      expect(parseEnv({ NODE_ENV: 'development', GOG_DATA_SOURCE: 'fixtures' }).siteUrl).toBe(
        'http://localhost:3000',
      );
    });

    it('defaults to localhost for a production build that is not the production deployment', () => {
      // `GOG_DATA_SOURCE=fixtures pnpm --filter @gog/web build` on a clean clone (spec 05, spec 07).
      expect(parseEnv({ NODE_ENV: 'production', GOG_DATA_SOURCE: 'fixtures' }).siteUrl).toBe(
        'http://localhost:3000',
      );
      expect(
        parseEnv({ NODE_ENV: 'production', VERCEL_ENV: 'preview', GOG_DATA_SOURCE: 'fixtures' })
          .siteUrl,
      ).toBe('http://localhost:3000');
    });

    it('is required on the production deployment', () => {
      expect(() =>
        parseEnv({ NODE_ENV: 'production', VERCEL_ENV: 'production', ...SUPABASE }),
      ).toThrow(/NEXT_PUBLIC_SITE_URL is required on the production deployment/);
    });

    it('drops a trailing slash', () => {
      expect(
        parseEnv({ GOG_DATA_SOURCE: 'fixtures', NEXT_PUBLIC_SITE_URL: 'https://example.com/' })
          .siteUrl,
      ).toBe('https://example.com');
    });
  });

  describe('data source', () => {
    it('parses fixtures with no Supabase variables', () => {
      expect(parseEnv({ GOG_DATA_SOURCE: 'fixtures' }).data).toEqual({ source: 'fixtures' });
    });

    it('refuses fixtures on the production deployment', () => {
      expect(() =>
        parseEnv({
          NODE_ENV: 'production',
          VERCEL_ENV: 'production',
          GOG_DATA_SOURCE: 'fixtures',
          NEXT_PUBLIC_SITE_URL: 'https://example.com',
        }),
      ).toThrow(/GOG_DATA_SOURCE=fixtures is refused on the production deployment/);
    });

    it('defaults to supabase and then needs the URL and key', () => {
      expect(() => parseEnv({})).toThrow(EnvError);
      expect(() => parseEnv({})).toThrow(
        /NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/,
      );
      expect(parseEnv(SUPABASE).data).toEqual({
        source: 'supabase',
        url: SUPABASE.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: SUPABASE.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });
    });

    it('refuses a service-role key in the anon key variable, naming the variable', () => {
      const attempt = () =>
        parseEnv({ ...SUPABASE, NEXT_PUBLIC_SUPABASE_ANON_KEY: SERVICE_ROLE_KEY });
      expect(attempt).toThrow(EnvError);
      expect(attempt).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      expect(attempt).toThrow(/anon\/publishable key/);
    });
  });

  it('splits the Android fingerprints and treats blanks as unset', () => {
    const env = parseEnv({
      GOG_DATA_SOURCE: 'fixtures',
      ANDROID_SHA256_FINGERPRINTS: ' AA:BB , CC:DD ,',
      NEXT_PUBLIC_IOS_APP_ID: '',
    });
    expect(env.androidSha256Fingerprints).toEqual(['AA:BB', 'CC:DD']);
    expect(env.iosAppId).toBeNull();
  });
});
