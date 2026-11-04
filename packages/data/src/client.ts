import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';
import type { ServerClock } from './clock';
import type { Database } from './database.types';
import { assertPublishableKey } from './publishable-key';

export type { Database } from './database.types';
export { createServerClock, systemClock, type Clock, type ServerClock } from './clock';
export { assertPublishableKey, isPublishableKey, PublishableKeyError } from './publishable-key';

/** The typed client every Supabase repository and the auth gateway take (ADR 0012). */
export type DataClient = SupabaseClient<Database>;

export interface ClientCredentials {
  /** The project URL, e.g. `https://xyz.supabase.co` or `http://127.0.0.1:54321`. */
  url: string;
  /**
   * The anon (publishable) key. Nothing in this package ever holds a service key (ADR 0011), and
   * both factories refuse one with `assertPublishableKey` before supabase-js sees it.
   */
  key: string;
}

export interface NativeClientOptions extends ClientCredentials {
  /** Where the session lives on the device, e.g. AsyncStorage (Supabase's Expo guide). */
  storage: SupportedStorage;
  /**
   * When given, every request goes through `clock.fetch`, so the `Date` header of each response
   * corrects the clock the app reads holds, countdowns and lead times against.
   */
  clock?: ServerClock | undefined;
}

/**
 * A client for servers without a user (the website, scripts): no session is kept or refreshed and
 * no URL is inspected for an OAuth callback. `fetch` is bound late so a runtime that patches the
 * global (Next.js caches per request) is honoured on every call.
 */
export function createPublicClient({ url, key }: ClientCredentials): DataClient {
  return createClient<Database>(url, assertPublishableKey(key), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, init) },
  });
}

/**
 * A client for React Native (spec 06, Supabase's Expo guide): the session is persisted in the
 * given storage and refreshed automatically; there is no URL to detect a session from. The app
 * ties `auth.startAutoRefresh()` / `stopAutoRefresh()` to the foreground state itself.
 */
export function createNativeClient({ url, key, storage, clock }: NativeClientOptions): DataClient {
  return createClient<Database>(url, assertPublishableKey(key), {
    auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    ...(clock === undefined ? {} : { global: { fetch: clock.fetch } }),
  });
}
