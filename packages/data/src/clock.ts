import type { IsoInstant } from '@gog/domain';
import { instantFromEpochMs } from './columns';

/** What repositories and screens take for "now"; injected so tests can move time deterministically. */
export type Clock = () => IsoInstant;

/** The device clock as it is, in the domain's canonical instant form. */
export const systemClock: Clock = () => instantFromEpochMs(Date.now());

/**
 * A clock that follows the server. Every hold expiry, lead-time check and countdown in the player
 * app compares a server-issued instant (`hold_expires_at = now() + 10 min` in Postgres) with the
 * phone's idea of now, and a phone clock set minutes off would hide live holds or offer starts the
 * server rejects. The `Date` header of every response (1 s resolution, plenty for a 10-minute hold)
 * tells us the server's time, so `now()` is the device time shifted by the last observed skew.
 */
export interface ServerClock {
  /** Device time corrected by the observed skew; the device time alone until a response is seen. */
  now: Clock;
  /** Server time minus device time in milliseconds; `0` until a response has been observed. */
  skewMs(): number;
  /** Records one server timestamp and the device time at which it was observed. */
  observe(serverEpochMs: number, observedAtMs?: number): void;
  /** `fetch` that feeds every response's `Date` header into this clock; pass it as `global.fetch`. */
  fetch: typeof fetch;
}

/** Below the header's own resolution a change is jitter, not drift, so the skew does not flap. */
const HEADER_RESOLUTION_MS = 1000;

export function createServerClock(): ServerClock {
  let skewMs = 0;

  const observe = (serverEpochMs: number, observedAtMs: number = Date.now()): void => {
    if (!Number.isFinite(serverEpochMs)) {
      return;
    }
    const observed = serverEpochMs - observedAtMs;
    if (Math.abs(observed - skewMs) >= HEADER_RESOLUTION_MS) {
      skewMs = observed;
    }
  };

  const correctedFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    const date = response.headers.get('date');
    if (date !== null) {
      observe(Date.parse(date));
    }
    return response;
  };

  return {
    now: () => instantFromEpochMs(Date.now() + skewMs),
    skewMs: () => skewMs,
    observe,
    fetch: correctedFetch,
  };
}
