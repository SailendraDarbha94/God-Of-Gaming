import { BOOKING_RULES, holdExpiresAt } from '@gog/domain';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServerClock, systemClock } from './clock';

const MINUTE_MS = 60_000;
/** The server's wall clock during these tests. */
const SERVER_NOW = Date.parse('2026-11-10T04:30:00Z');

afterEach(() => {
  vi.useRealTimers();
});

describe('systemClock', () => {
  it('reads the device clock in the canonical instant form', () => {
    vi.useFakeTimers({ now: SERVER_NOW + 500 });
    expect(systemClock()).toBe('2026-11-10T04:30:00.500Z');
  });
});

describe('createServerClock', () => {
  it('is the device clock until a server time has been observed', () => {
    vi.useFakeTimers({ now: SERVER_NOW });
    const clock = createServerClock();
    expect(clock.skewMs()).toBe(0);
    expect(clock.now()).toBe('2026-11-10T04:30:00Z');
  });

  it('keeps a hold the server issued 10 seconds ago live on a phone that runs 10 minutes fast', () => {
    const phoneNow = SERVER_NOW + 10 * MINUTE_MS;
    vi.useFakeTimers({ now: phoneNow });
    const clock = createServerClock();
    // The hold was created at SERVER_NOW - 10 s; the response that returned it carried the server's Date.
    const expiresAt = holdExpiresAt('2026-11-10T04:29:50Z');
    expect(Date.parse(expiresAt) <= Date.now()).toBe(true); // the raw device clock says it lapsed

    clock.observe(SERVER_NOW);
    expect(clock.skewMs()).toBe(-10 * MINUTE_MS);
    expect(Date.parse(expiresAt) > Date.parse(clock.now())).toBe(true);
    expect(Date.parse(expiresAt) - Date.parse(clock.now())).toBe(
      BOOKING_RULES.holdMinutes * MINUTE_MS - 10_000,
    );
  });

  it('moves a slow phone forward so a lapsed hold reads as lapsed', () => {
    vi.useFakeTimers({ now: SERVER_NOW - 10 * MINUTE_MS });
    const clock = createServerClock();
    const expiresAt = holdExpiresAt('2026-11-10T04:15:00Z'); // lapsed five minutes ago, server time
    expect(Date.parse(expiresAt) > Date.now()).toBe(true); // the raw device clock says 15 minutes left
    clock.observe(SERVER_NOW);
    expect(Date.parse(expiresAt) <= Date.parse(clock.now())).toBe(true);
  });

  it('ignores jitter below the Date header resolution', () => {
    vi.useFakeTimers({ now: SERVER_NOW });
    const clock = createServerClock();
    clock.observe(SERVER_NOW + 5000);
    expect(clock.skewMs()).toBe(5000);
    clock.observe(SERVER_NOW + 5600);
    expect(clock.skewMs()).toBe(5000);
    clock.observe(SERVER_NOW + 7000);
    expect(clock.skewMs()).toBe(7000);
    clock.observe(Number.NaN);
    expect(clock.skewMs()).toBe(7000);
  });

  it('reads the Date header of every response its fetch sees', async () => {
    vi.useFakeTimers({ now: SERVER_NOW });
    const clock = createServerClock();
    const serverDate = new Date(SERVER_NOW + 2 * MINUTE_MS).toUTCString();
    const stub = vi.fn(() =>
      Promise.resolve(new Response('[]', { headers: { date: serverDate } })),
    );
    vi.stubGlobal('fetch', stub);
    try {
      const response = await clock.fetch('http://127.0.0.1:54321/rest/v1/cities', {
        method: 'GET',
      });
      expect(stub).toHaveBeenCalledOnce();
      expect(await response.text()).toBe('[]');
      expect(clock.skewMs()).toBe(2 * MINUTE_MS);

      vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve(new Response('[]'))),
      );
      await clock.fetch('http://127.0.0.1:54321/rest/v1/cities');
      expect(clock.skewMs()).toBe(2 * MINUTE_MS); // no header, no change
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
