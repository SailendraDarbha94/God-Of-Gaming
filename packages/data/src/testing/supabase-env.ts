import { z } from 'zod';
import { isPublishableKey } from '../publishable-key';

/**
 * The Supabase stack the contract suites may run against (spec 04: the Supabase implementation runs
 * the contract suites only when these variables are set). The phone and code default to the test
 * OTP entry in `supabase/config.toml`, so a local `supabase start` needs only the URL and anon key.
 * The key must be the anon key: a service-role key would run the suites with RLS bypassed and let
 * them pass for the wrong reason (ADR 0011).
 */
export interface SupabaseTestTarget {
  url: string;
  anonKey: string;
  /** E.164 with `+`; must be a `[auth.sms.test_otp]` number of the target stack. */
  phone: string;
  otp: string;
}

export const SUPABASE_TEST_SKIP_REASON =
  'set GOG_TEST_SUPABASE_URL and GOG_TEST_SUPABASE_ANON_KEY to run against a Supabase stack';

const TestEnv = z.object({
  GOG_TEST_SUPABASE_URL: z.url(),
  GOG_TEST_SUPABASE_ANON_KEY: z.string().min(1).refine(isPublishableKey, {
    message: 'must be the anon/publishable key, not the service-role key (ADR 0011)',
  }),
  GOG_TEST_SUPABASE_PHONE: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/)
    .default('+919999900001'),
  GOG_TEST_SUPABASE_OTP: z.string().min(1).default('123456'),
});

/**
 * `z.looseObject`, not `z.record`: Zod 4's record rejects Node's exotic `process.env` as not a plain
 * object, which made this read come back empty and every contract suite skip.
 */
const ProcessLike = z.object({ env: z.looseObject({}) });

/** `process.env` when there is a `process` (Node, Vitest); this package has no Node types. */
function processEnv(): Record<string, unknown> {
  const candidate: unknown = Reflect.get(globalThis, 'process');
  const parsed = ProcessLike.safeParse(candidate);
  return parsed.success ? parsed.data.env : {};
}

/** The configured target, or `null` when the two required variables are absent. */
export function supabaseTestTarget(): SupabaseTestTarget | null {
  const env = processEnv();
  if (env.GOG_TEST_SUPABASE_URL === undefined || env.GOG_TEST_SUPABASE_ANON_KEY === undefined) {
    return null;
  }
  // Present but malformed values fail loudly rather than silently skipping the suite.
  const parsed = TestEnv.parse(env);
  return {
    url: parsed.GOG_TEST_SUPABASE_URL,
    anonKey: parsed.GOG_TEST_SUPABASE_ANON_KEY,
    phone: parsed.GOG_TEST_SUPABASE_PHONE,
    otp: parsed.GOG_TEST_SUPABASE_OTP,
  };
}
