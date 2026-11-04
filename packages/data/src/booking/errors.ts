import { BookingError, type BookingErrorCode } from '@gog/domain';
import type { PostgrestFailure } from '../errors';

/**
 * SQLSTATE and PostgREST codes to `BookingErrorCode` (spec 03 §Functions, spec 04
 * `mapPostgrestError`). `GG001`–`GG009` are raised by our functions; `42501` is what an anonymous
 * call to a function granted to `authenticated` only gets (permission denied before the body runs);
 * `PGRST301`–`303` are JWT failures; `PGRST116` is `.single()` over zero rows.
 */
const CODE_MAP: Readonly<Record<string, BookingErrorCode>> = {
  GG001: 'auth_required',
  GG002: 'invalid_request',
  GG003: 'outside_hours',
  GG004: 'not_enough_seats',
  GG005: 'seat_conflict',
  GG006: 'cafe_not_bookable',
  GG007: 'not_found',
  GG008: 'invalid_state',
  GG009: 'limit_reached',
  42501: 'auth_required',
  PGRST301: 'auth_required',
  PGRST302: 'auth_required',
  PGRST303: 'auth_required',
  PGRST116: 'not_found',
};

/**
 * Anything not in the table is `unknown`; the PostgREST error travels along as `cause`, and the
 * message is PostgREST's (developer-facing; the apps show copy keyed by `code`).
 */
export function mapPostgrestError(error: PostgrestFailure): BookingError {
  const code = CODE_MAP[error.code] ?? 'unknown';
  return new BookingError(code, error.message, { cause: error });
}
