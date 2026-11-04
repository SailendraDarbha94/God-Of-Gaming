import { createNativeClient } from '@gog/data/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { clock } from './clock';
import type { SupabaseEnv } from './env';

/**
 * The one module that knows the app talks to Supabase (ADR 0011; the lint boundary bans
 * `@supabase/supabase-js` everywhere else). It follows Supabase's Expo tutorial as read on
 * 2026-11-04 (supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native):
 *
 * - AsyncStorage holds the player's access and refresh tokens unencrypted inside the app sandbox.
 *   Acceptable for the development build, to be revisited before public launch (ADR 0011) with
 *   Supabase's SecureStore adapter (`expo-secure-store` + `aes-js` + `react-native-get-random-values`).
 *   The anon key is not what the store protects; that is inlined in the bundle and public anyway.
 * - `autoRefreshToken`, `persistSession` and `detectSessionInUrl: false` are set by
 *   `createNativeClient` in `@gog/data`.
 * - Every request goes through the app clock's `fetch`, so the `Date` header of each response keeps
 *   hold expiry and lead-time checks on the server's time, not the phone's (lib/clock.ts).
 * - No `react-native-url-polyfill`: the tutorial no longer installs it and React Native 0.88 ships
 *   a WHATWG `URL`.
 * - Token refresh is tied to the foreground state, as the `startAutoRefresh` reference shows for
 *   React Native (on native the loop would otherwise run continuously in the background).
 */
export function createSupabase(config: SupabaseEnv) {
  const client = createNativeClient({
    url: config.url,
    key: config.anonKey,
    storage: AsyncStorage,
    clock,
  });

  // Registered once for the app lifetime: this module is evaluated a single time by Metro.
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void client.auth.startAutoRefresh();
    } else {
      void client.auth.stopAutoRefresh();
    }
  });

  return client;
}
