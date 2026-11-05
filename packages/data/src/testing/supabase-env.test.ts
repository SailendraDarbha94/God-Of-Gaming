import { afterEach, describe, expect, it, vi } from 'vitest';
import { supabaseTestTarget } from './supabase-env';

const STACK_URL = 'http://127.0.0.1:54321';

/**
 * Set through `vi.stubEnv`, so these run against the real `process.env`, an exotic object that a
 * plain copy would hide: reading it wrongly leaves every contract suite silently skipped. CI's
 * contract step sets both variables for this whole process, so each test sets or clears its own.
 */
describe('supabaseTestTarget', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the target from process.env, with the test-OTP defaults', () => {
    vi.stubEnv('GOG_TEST_SUPABASE_URL', STACK_URL);
    vi.stubEnv('GOG_TEST_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('GOG_TEST_SUPABASE_PHONE', undefined);
    vi.stubEnv('GOG_TEST_SUPABASE_OTP', undefined);

    expect(supabaseTestTarget()).toEqual({
      url: STACK_URL,
      anonKey: 'anon-key',
      phone: '+919999900001',
      otp: '123456',
    });
  });

  it('reads an overridden phone and code', () => {
    vi.stubEnv('GOG_TEST_SUPABASE_URL', STACK_URL);
    vi.stubEnv('GOG_TEST_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('GOG_TEST_SUPABASE_PHONE', '+919999900002');
    vi.stubEnv('GOG_TEST_SUPABASE_OTP', '654321');

    expect(supabaseTestTarget()).toMatchObject({ phone: '+919999900002', otp: '654321' });
  });

  it.each([
    ['GOG_TEST_SUPABASE_URL', 'GOG_TEST_SUPABASE_ANON_KEY'],
    ['GOG_TEST_SUPABASE_ANON_KEY', 'GOG_TEST_SUPABASE_URL'],
  ])('is null when %s is absent', (absent, present) => {
    vi.stubEnv(absent, undefined);
    vi.stubEnv(present, present === 'GOG_TEST_SUPABASE_URL' ? STACK_URL : 'anon-key');

    expect(supabaseTestTarget()).toBeNull();
  });

  it('fails loudly on a malformed URL rather than skipping', () => {
    vi.stubEnv('GOG_TEST_SUPABASE_URL', 'not a url');
    vi.stubEnv('GOG_TEST_SUPABASE_ANON_KEY', 'anon-key');

    expect(() => supabaseTestTarget()).toThrow();
  });

  it('refuses a secret key, which would pass the suites with RLS bypassed', () => {
    vi.stubEnv('GOG_TEST_SUPABASE_URL', STACK_URL);
    vi.stubEnv('GOG_TEST_SUPABASE_ANON_KEY', 'sb_secret_x');

    expect(() => supabaseTestTarget()).toThrow(/anon\/publishable/);
  });
});
