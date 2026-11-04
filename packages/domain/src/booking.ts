import { z } from 'zod';
import { BOOKING_RULES, IST_OFFSET_MINUTES } from './constants';
import { CafeRef } from './entities';
import { BookingSource, BookingStatus, StationKind } from './enums';
import { err, ok, type Result } from './result';
import { IsoInstant, LocalDate, Minutes, Paise, Uuid } from './scalars';
import { addMinutes } from './time';

/**
 * Booking entities and rules (spec 02 §Entities, §Pure functions). The same numbers are enforced
 * by `create_booking` in SQL (spec 03); this module lets the app reject a request before the round
 * trip and compute the price the database will charge.
 */

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const AvailabilitySlot = z.object({
  startsAt: IsoInstant,
  freeSeats: z.number().int().nonnegative(),
});
export type AvailabilitySlot = z.infer<typeof AvailabilitySlot>;

/** `day` is the opening day in IST (see `hours.ts`); `stepMinutes` defaults to 30 downstream. */
export const AvailabilityRequest = z.object({
  tierId: Uuid,
  day: LocalDate,
  durationMinutes: Minutes,
  stepMinutes: Minutes.optional(),
});
export type AvailabilityRequest = z.infer<typeof AvailabilityRequest>;

export const BookingRequest = z.object({
  cafeId: Uuid,
  tierId: Uuid,
  startsAt: IsoInstant,
  durationMinutes: Minutes,
  seatCount: z.number().int(),
});
export type BookingRequest = z.infer<typeof BookingRequest>;

export const BookingSeat = z.object({
  stationId: Uuid,
  stationLabel: z.string(),
  releasedAt: IsoInstant.nullable(),
});
export type BookingSeat = z.infer<typeof BookingSeat>;

/**
 * `cafe`, `tier`, `seats[].stationLabel` and `hourlyRatePaise` are the values copied at hold time,
 * not live catalog values, so a booking is self-contained and later price or name changes do not
 * alter it (spec 02, 03).
 */
export const Booking = z.object({
  id: Uuid,
  cafe: CafeRef,
  tier: z.object({ id: Uuid, name: z.string(), kind: StationKind }),
  status: BookingStatus,
  startsAt: IsoInstant,
  endsAt: IsoInstant,
  seatCount: z.number().int(),
  hourlyRatePaise: Paise,
  totalPaise: Paise,
  lockFeePaise: Paise,
  holdExpiresAt: IsoInstant.nullable(),
  source: BookingSource,
  seats: z.array(BookingSeat),
  createdAt: IsoInstant,
});
export type Booking = z.infer<typeof Booking>;

export type ValidationIssueCode =
  | 'invalid_shape'
  | 'duration_out_of_range'
  | 'duration_not_multiple_of_step'
  | 'seat_count_out_of_range'
  | 'start_not_aligned'
  | 'start_too_soon'
  | 'start_too_far';

export interface ValidationIssue {
  /** Dotted field path, empty for the request as a whole. */
  path: string;
  code: ValidationIssueCode;
  message: string;
}

/**
 * Parses an untrusted request and applies the booking rules. Shape errors come back alone (the
 * rules need a shape to run on); otherwise every failed rule is reported at once.
 */
export function validateBookingRequest(
  req: unknown,
  now: IsoInstant,
): Result<BookingRequest, ValidationIssue[]> {
  const parsed = BookingRequest.safeParse(req);
  if (!parsed.success) {
    return err(
      parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        code: 'invalid_shape' as const,
        message: issue.message,
      })),
    );
  }

  const request = parsed.data;
  const { minMinutes, maxMinutes, stepMinutes, minSeats, maxSeats, minLeadMinutes, maxLeadDays } =
    BOOKING_RULES;
  const issues: ValidationIssue[] = [];

  if (request.durationMinutes < minMinutes || request.durationMinutes > maxMinutes) {
    issues.push({
      path: 'durationMinutes',
      code: 'duration_out_of_range',
      message: `Duration must be between ${minMinutes} and ${maxMinutes} minutes`,
    });
  }
  if (request.durationMinutes % stepMinutes !== 0) {
    issues.push({
      path: 'durationMinutes',
      code: 'duration_not_multiple_of_step',
      message: `Duration must be a multiple of ${stepMinutes} minutes`,
    });
  }
  if (request.seatCount < minSeats || request.seatCount > maxSeats) {
    issues.push({
      path: 'seatCount',
      code: 'seat_count_out_of_range',
      message: `Seat count must be between ${minSeats} and ${maxSeats}`,
    });
  }

  const startMs = Date.parse(request.startsAt);
  const nowMs = Date.parse(now);
  // The start grid is the same 30-minute grid as the duration step. IST is +05:30, a multiple of
  // 30 minutes, so the IST grid and the UTC grid coincide (as `extract(epoch) % 1800` assumes in SQL).
  if ((startMs + IST_OFFSET_MINUTES * MINUTE_MS) % (stepMinutes * MINUTE_MS) !== 0) {
    issues.push({
      path: 'startsAt',
      code: 'start_not_aligned',
      message: `Start must be on a ${stepMinutes}-minute boundary`,
    });
  }
  if (startMs < nowMs + minLeadMinutes * MINUTE_MS) {
    issues.push({
      path: 'startsAt',
      code: 'start_too_soon',
      message: `Start must be at least ${minLeadMinutes} minutes from now`,
    });
  }
  if (startMs > nowMs + maxLeadDays * DAY_MS) {
    issues.push({
      path: 'startsAt',
      code: 'start_too_far',
      message: `Start must be within ${maxLeadDays} days from now`,
    });
  }

  return issues.length > 0 ? err(issues) : ok(request);
}

export interface QuoteInput {
  hourlyRatePaise: Paise;
  durationMinutes: Minutes;
  seatCount: number;
}

export interface Quote {
  perSeatPaise: Paise;
  totalPaise: Paise;
}

/**
 * `Math.round` rounds halves up, which equals SQL `round(numeric)` (ties away from zero) for
 * non-negative values, so 8025 paise × 30 min is 4013 on both sides (spec 02, 03).
 */
export function quote(input: QuoteInput): Quote {
  const perSeatPaise = Math.round((input.hourlyRatePaise * input.durationMinutes) / 60);
  return { perSeatPaise, totalPaise: perSeatPaise * input.seatCount };
}

export function holdExpiresAt(
  now: IsoInstant,
  minutes: Minutes = BOOKING_RULES.holdMinutes,
): IsoInstant {
  return addMinutes(now, minutes);
}

/** held → confirmed | cancelled | expired; confirmed → cancelled | completed | no_show. */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  switch (from) {
    case 'held':
      return to === 'confirmed' || to === 'cancelled' || to === 'expired';
    case 'confirmed':
      return to === 'cancelled' || to === 'completed' || to === 'no_show';
    case 'cancelled':
    case 'expired':
    case 'completed':
    case 'no_show':
      return false;
  }
}
