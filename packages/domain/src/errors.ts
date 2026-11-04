import { z } from 'zod';

export const BookingErrorCode = z.enum([
  'auth_required',
  'invalid_request',
  'outside_hours',
  'not_enough_seats',
  'seat_conflict',
  'cafe_not_bookable',
  'not_found',
  'invalid_state',
  'limit_reached',
  'unknown',
]);
export type BookingErrorCode = z.infer<typeof BookingErrorCode>;

/** Developer-facing defaults; user copy lives in the apps, keyed by `code`. */
const DEFAULT_MESSAGES: Readonly<Record<BookingErrorCode, string>> = {
  auth_required: 'authentication required',
  invalid_request: 'invalid booking request',
  outside_hours: 'outside opening hours',
  not_enough_seats: 'not enough free seats',
  seat_conflict: 'seat conflict, safe to retry once',
  cafe_not_bookable: 'cafe not bookable',
  not_found: 'booking not found or not permitted',
  invalid_state: 'invalid state transition',
  limit_reached: 'booking limit reached (live holds or upcoming bookings)',
  unknown: 'unknown booking failure',
};

/**
 * A business failure of the booking flow, thrown by `@gog/data` after mapping the SQLSTATE
 * (`GG001` → `auth_required`, …; spec 03 and 04). `retryable` is true only for `seat_conflict`:
 * the data layer retries that once, every other code needs a different request or a signed-in user.
 */
export class BookingError extends Error {
  readonly code: BookingErrorCode;
  readonly retryable: boolean;

  constructor(code: BookingErrorCode, message?: string, options?: ErrorOptions) {
    super(message ?? DEFAULT_MESSAGES[code], options);
    this.name = 'BookingError';
    this.code = code;
    this.retryable = code === 'seat_conflict';
  }
}
