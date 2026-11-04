import type { SupportedStorage } from '@supabase/supabase-js';
import { describe } from 'vitest';
import { SupabaseAuthGateway } from '../auth/supabase-auth';
import { createNativeClient, createPublicClient } from '../client';
import { instantFromEpochMs } from '../columns';
import { describeBookingRepository } from '../testing/booking-contract';
import { SUPABASE_TEST_SKIP_REASON, supabaseTestTarget } from '../testing/supabase-env';
import { SupabaseBookingRepository } from './supabase-booking';

/**
 * The contract suite against a real, seeded stack with the test OTP of `supabase/config.toml`
 * (`supabase start` locally). The signed-in client keeps its session in memory, like the app keeps
 * it in AsyncStorage; the signed-out one is the website's public client.
 */
const target = supabaseTestTarget();

function memoryStorage(): SupportedStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      items.delete(key);
      return Promise.resolve();
    },
  };
}

describe.skipIf(target === null)(
  target === null
    ? `SupabaseBookingRepository (skipped: ${SUPABASE_TEST_SKIP_REASON})`
    : 'SupabaseBookingRepository',
  () => {
    describeBookingRepository('against the configured stack', async () => {
      if (target === null) {
        throw new Error(SUPABASE_TEST_SKIP_REASON);
      }
      const client = createNativeClient({
        url: target.url,
        key: target.anonKey,
        storage: memoryStorage(),
      });
      const auth = new SupabaseAuthGateway(client);
      await auth.signInWithPhone(target.phone);
      await auth.verifyOtp(target.phone, target.otp);
      return {
        repository: new SupabaseBookingRepository(client),
        now: () => instantFromEpochMs(Date.now()),
        signedOut: new SupabaseBookingRepository(
          createPublicClient({ url: target.url, key: target.anonKey }),
        ),
      };
    });
  },
);
