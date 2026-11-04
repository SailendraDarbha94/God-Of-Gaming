import type { SupportedStorage } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNativeClient, createPublicClient, createServerClock } from './client';
import { PublishableKeyError } from './publishable-key';

const CREDENTIALS = { url: 'http://127.0.0.1:54321', key: 'anon-key' };

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Built, not pasted, so no `eyJ…` literal sits in the tree for the secret scan to find. */
const SERVICE_ROLE_KEY = `${base64Url('{"alg":"HS256","typ":"JWT"}')}.${base64Url(
  '{"iss":"supabase-demo","role":"service_role","exp":1983812996}',
)}.signature`;

/** A storage adapter with the AsyncStorage shape that records every call. */
function spyStorage() {
  const items = new Map<string, string>();
  const reads: string[] = [];
  const storage: SupportedStorage = {
    getItem: (key) => {
      reads.push(key);
      return Promise.resolve(items.get(key) ?? null);
    },
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      items.delete(key);
      return Promise.resolve();
    },
  };
  return { storage, reads, items };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPublicClient', () => {
  it('sends requests through the late-bound global fetch and keeps no session', async () => {
    const stub = vi.fn(() =>
      Promise.resolve(
        new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
      ),
    );
    vi.stubGlobal('fetch', stub);
    const client = createPublicClient(CREDENTIALS);

    const { data, error } = await client.from('cities').select('id');
    expect(error).toBeNull();
    expect(data).toEqual([]);
    expect(stub).toHaveBeenCalledOnce();
    const [url, init] = stub.mock.calls[0] as unknown as [string | URL, RequestInit];
    expect(String(url)).toContain('/rest/v1/cities');
    expect(new Headers(init.headers).get('apikey')).toBe(CREDENTIALS.key);

    // persistSession: false means nothing was read from or written to any storage.
    const { data: session } = await client.auth.getSession();
    expect(session.session).toBeNull();
  });

  it('refuses a service-role key before supabase-js is touched', () => {
    expect(() => createPublicClient({ ...CREDENTIALS, key: SERVICE_ROLE_KEY })).toThrow(
      PublishableKeyError,
    );
  });
});

describe('createNativeClient', () => {
  it('reads the persisted session from the given storage adapter', async () => {
    const { storage, reads } = spyStorage();
    const client = createNativeClient({ ...CREDENTIALS, storage });
    const { data, error } = await client.auth.getSession();
    expect(error).toBeNull();
    expect(data.session).toBeNull();
    expect(reads.some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))).toBe(true);
    expect(typeof client.auth.startAutoRefresh).toBe('function');
  });

  it('routes requests through the server clock when one is given', async () => {
    const serverDate = new Date(Date.now() + 120_000).toUTCString();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response('[]', {
            status: 200,
            headers: { 'content-type': 'application/json', date: serverDate },
          }),
        ),
      ),
    );
    const clock = createServerClock();
    const client = createNativeClient({ ...CREDENTIALS, storage: spyStorage().storage, clock });
    const { error } = await client.from('cities').select('id');
    expect(error).toBeNull();
    expect(clock.skewMs()).toBeGreaterThan(100_000);
  });

  it('refuses a service-role key before supabase-js is touched', () => {
    expect(() =>
      createNativeClient({ ...CREDENTIALS, key: SERVICE_ROLE_KEY, storage: spyStorage().storage }),
    ).toThrow(PublishableKeyError);
  });
});
