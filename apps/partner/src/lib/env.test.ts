import { describe, expect, it } from 'vitest';

import { EnvError, parseEnv, type EnvSource } from './env';

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * A JWT with the given claims and a nonsense signature, built here rather than pasted: a literal
 * `eyJ…` string in the tree would trip the secret scan in CI for nothing.
 */
function token(claims: Record<string, unknown>): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  return `${header}.${base64Url(JSON.stringify(claims))}.signature-that-is-never-checked`;
}

const NOTHING: EnvSource = {
  NEXT_PUBLIC_GOG_DATA_SOURCE: undefined,
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
  NEXT_PUBLIC_WEBSITE_URL: undefined,
};

const LOCAL_SUPABASE: EnvSource = {
  ...NOTHING,
  NEXT_PUBLIC_GOG_DATA_SOURCE: 'supabase',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_local',
};

describe('parseEnv', () => {
  it('defaults to Supabase and then requires the URL and the anon key', () => {
    expect(() => parseEnv(NOTHING)).toThrow(EnvError);
    expect(() => parseEnv(NOTHING)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => parseEnv(NOTHING)).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('runs on fixtures with no backend at all', () => {
    expect(parseEnv({ ...NOTHING, NEXT_PUBLIC_GOG_DATA_SOURCE: 'fixtures' })).toEqual({
      data: { source: 'fixtures' },
      websiteUrl: null,
    });
  });

  it('returns the Supabase URL and key', () => {
    expect(parseEnv(LOCAL_SUPABASE)).toEqual({
      data: {
        source: 'supabase',
        url: 'http://127.0.0.1:54321',
        anonKey: 'sb_publishable_local',
      },
      websiteUrl: null,
    });
  });

  it('accepts an anon JWT', () => {
    const anonKey = token({ iss: 'supabase', role: 'anon' });
    expect(parseEnv({ ...LOCAL_SUPABASE, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey }).data).toEqual({
      source: 'supabase',
      url: 'http://127.0.0.1:54321',
      anonKey,
    });
  });

  it.each([
    ['an sb_secret_ key', 'sb_secret_probe'],
    ['a service_role JWT', token({ iss: 'supabase', role: 'service_role' })],
    ["a user's access token", token({ role: 'authenticated', sub: 'someone' })],
    ['an eyJ string that is not a JWT', 'eyJ.garbage.sig'],
  ])('refuses %s on either source, without repeating it', (_name, key) => {
    for (const source of ['supabase', 'fixtures']) {
      const attempt = () =>
        parseEnv({
          ...LOCAL_SUPABASE,
          NEXT_PUBLIC_GOG_DATA_SOURCE: source,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
        });
      expect(attempt).toThrow(/anon\/publishable key/);
      expect(attempt).not.toThrow(key);
    }
  });

  it('treats blank values as unset', () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_GOG_DATA_SOURCE: ' fixtures ',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '   ',
        NEXT_PUBLIC_WEBSITE_URL: '',
      }),
    ).toEqual({ data: { source: 'fixtures' }, websiteUrl: null });
  });

  it('refuses an unknown data source', () => {
    expect(() => parseEnv({ ...NOTHING, NEXT_PUBLIC_GOG_DATA_SOURCE: 'Fixtures' })).toThrow(
      /NEXT_PUBLIC_GOG_DATA_SOURCE/,
    );
  });

  it('refuses URLs that are not http or https', () => {
    expect(() =>
      parseEnv({ ...LOCAL_SUPABASE, NEXT_PUBLIC_SUPABASE_URL: 'ftp://127.0.0.1:54321' }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() =>
      parseEnv({
        ...NOTHING,
        NEXT_PUBLIC_GOG_DATA_SOURCE: 'fixtures',
        NEXT_PUBLIC_WEBSITE_URL: 'javascript:alert(1)',
      }),
    ).toThrow(/NEXT_PUBLIC_WEBSITE_URL/);
  });

  it('keeps the website URL without trailing slashes', () => {
    expect(
      parseEnv({
        ...NOTHING,
        NEXT_PUBLIC_GOG_DATA_SOURCE: 'fixtures',
        NEXT_PUBLIC_WEBSITE_URL: 'https://example.com//',
      }).websiteUrl,
    ).toBe('https://example.com');
  });
});
