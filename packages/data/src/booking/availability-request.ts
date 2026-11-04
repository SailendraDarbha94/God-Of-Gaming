import { AvailabilityRequest, BOOKING_RULES, BookingError, type Minutes } from '@gog/domain';

export type ParsedAvailabilityRequest = AvailabilityRequest & { stepMinutes: Minutes };

/**
 * The request check both `getAvailability` implementations run before touching their backend, so a
 * malformed request (`tierId: 'not-a-uuid'`, `day: '20-11-2026'`, a zero duration) is the same
 * `BookingError('invalid_request')` on fixtures and on Supabase, where Postgres would otherwise
 * answer `22P02` and surface as `unknown` (ADR 0012: the two implementations must not drift).
 */
export function parseAvailabilityRequest(request: AvailabilityRequest): ParsedAvailabilityRequest {
  const parsed = AvailabilityRequest.safeParse(request);
  if (!parsed.success) {
    throw new BookingError('invalid_request', parsed.error.message, { cause: parsed.error });
  }
  const stepMinutes = parsed.data.stepMinutes ?? BOOKING_RULES.stepMinutes;
  if (parsed.data.durationMinutes < 1 || stepMinutes < 1) {
    throw new BookingError(
      'invalid_request',
      'duration and step must be positive numbers of minutes',
    );
  }
  return { ...parsed.data, stepMinutes };
}
