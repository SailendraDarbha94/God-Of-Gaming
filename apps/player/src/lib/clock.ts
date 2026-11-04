import { createServerClock } from '@gog/data/client';
import type { IsoInstant } from '@gog/domain';

/**
 * The one clock the app reads. Hold expiry, lead-time gating and countdowns all compare server-issued
 * instants with "now", so the device clock is corrected by the `Date` header of every Supabase
 * response (`createNativeClient` routes requests through `clock.fetch`). On fixtures there is no
 * server and the device clock stands; the in-memory repository reads this same clock.
 */
export const clock = createServerClock();

export function nowIso(): IsoInstant {
  return clock.now();
}
