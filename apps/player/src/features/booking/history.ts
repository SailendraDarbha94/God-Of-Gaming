import { canTransition, type Booking, type BookingStatus, type IsoInstant } from '@gog/domain';

export interface BookingHistory {
  /** Held or confirmed sessions that have not ended, soonest first. */
  upcoming: Booking[];
  /** Everything else, newest first (the order `listMine` returns). */
  past: Booking[];
}

/**
 * A hold whose timer has run out at `now`. On Supabase the row still reads `held` until the sweeper
 * or the next hold on that tier expires it (spec 03), so the screens derive this themselves.
 */
export function hasLapsed(booking: Booking, now: IsoInstant): boolean {
  return (
    booking.status === 'held' &&
    booking.holdExpiresAt !== null &&
    Date.parse(booking.holdExpiresAt) <= Date.parse(now)
  );
}

/**
 * What a booking reads as on screen: the server's status, except that a lapsed hold reads `expired`
 * ahead of the sweep. A display hint: the hold screen gates Confirm and Release on `booking.status`,
 * the server's verdict, never on this.
 */
export function effectiveStatus(booking: Booking, now: IsoInstant): BookingStatus {
  return hasLapsed(booking, now) ? 'expired' : booking.status;
}

/** A list card offers Cancel while the session reads live and has not ended. */
export function isCancellable(booking: Booking, now: IsoInstant): boolean {
  return (
    canTransition(effectiveStatus(booking, now), 'cancelled') &&
    Date.parse(booking.endsAt) > Date.parse(now)
  );
}

/** Instants are compared as numbers: the mappers emit `…:00Z`, a clock emits `…:00.500Z`. */
export function splitBookings(bookings: Booking[], now: IsoInstant): BookingHistory {
  const nowMs = Date.parse(now);
  const upcoming: Booking[] = [];
  const past: Booking[] = [];
  for (const booking of bookings) {
    const status = effectiveStatus(booking, now);
    const live = status === 'held' || status === 'confirmed';
    if (live && Date.parse(booking.endsAt) > nowMs) {
      upcoming.push(booking);
    } else {
      past.push(booking);
    }
  }
  upcoming.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return { upcoming, past };
}
