import { describe, expect, it } from 'vitest';
import { assertPublishableKey, isPublishableKey, PublishableKeyError } from './publishable-key';

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * A JWT with the given claims and a nonsense signature. The guard reads the payload only, so the
 * tokens are built here rather than pasted: the `supabase start` demo keys are public, but a literal
 * `eyJ…` string in the tree would trip the secret scan in CI for nothing.
 */
function token(claims: Record<string, unknown>, options: { padded?: boolean } = {}): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  let payload = base64Url(JSON.stringify(claims));
  if (options.padded === true) {
    payload = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
  }
  return `${header}.${payload}.signature-that-is-never-checked`;
}

/** The claims of the local `supabase start` demo keys (iss supabase-demo, exp in 2032). */
const DEMO_ANON = token({ iss: 'supabase-demo', role: 'anon', exp: 1983812996 });
const DEMO_SERVICE_ROLE = token({ iss: 'supabase-demo', role: 'service_role', exp: 1983812996 });
/** A hosted project's anon key carries `ref` and `iat` and comes without padding. */
const HOSTED_ANON = token({
  iss: 'supabase',
  ref: 'abcdefghijklmnopqrst',
  role: 'anon',
  iat: 1762200000,
  exp: 2077760000,
});
const USER_TOKEN = token({
  aud: 'authenticated',
  role: 'authenticated',
  sub: '11111111-1111-4111-8111-111111111111',
});

describe('isPublishableKey', () => {
  it.each([
    ['the demo anon JWT', DEMO_ANON],
    ['a hosted anon JWT without padding', HOSTED_ANON],
    ['a padded anon JWT', token({ role: 'anon' }, { padded: true })],
    ['a publishable key', 'sb_publishable_x'],
    ['an opaque string the server will judge', 'anon-key'],
    ['an empty string', ''],
  ])('accepts %s', (_name, key) => {
    expect(isPublishableKey(key)).toBe(true);
  });

  it.each([
    ['the demo service_role JWT', DEMO_SERVICE_ROLE],
    ["a user's authenticated token", USER_TOKEN],
    ['a secret key', 'sb_secret_x'],
    ['an eyJ string that is not a JWT', 'eyJ.garbage.sig'],
    ['a JWT without a role claim', token({ sub: 'someone' })],
  ])('rejects %s', (_name, key) => {
    expect(isPublishableKey(key)).toBe(false);
  });
});

describe('assertPublishableKey', () => {
  it('returns an acceptable key unchanged', () => {
    expect(assertPublishableKey(DEMO_ANON)).toBe(DEMO_ANON);
    expect(assertPublishableKey('sb_publishable_x')).toBe('sb_publishable_x');
  });

  it('names the role it found, never the key', () => {
    expect(() => assertPublishableKey(DEMO_SERVICE_ROLE)).toThrow(PublishableKeyError);
    expect(() => assertPublishableKey(DEMO_SERVICE_ROLE)).toThrow(/role "service_role".*ADR 0011/);
    try {
      assertPublishableKey(DEMO_SERVICE_ROLE);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain(DEMO_SERVICE_ROLE);
    }
  });

  it('names an sb_secret_ key as such', () => {
    expect(() => assertPublishableKey('sb_secret_abc')).toThrow(/sb_secret_ key/);
    expect(() => assertPublishableKey('sb_secret_abc')).not.toThrow(/sb_secret_abc/);
  });

  it('refuses an eyJ string it cannot read as a JWT', () => {
    expect(() => assertPublishableKey('eyJ.garbage.sig')).toThrow(/cannot be read/);
  });
});
