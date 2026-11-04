import { describe, expect, it } from 'vitest';
import {
  AvailabilityRequest,
  AvailabilitySlot,
  Booking,
  BookingRequest,
  BookingSeat,
  canTransition,
  holdExpiresAt,
  quote,
  validateBookingRequest,
  type ValidationIssue,
} from './booking';
import { BookingStatus } from './enums';
import type { Result } from './result';

const CAFE_ID = '00000000-0000-4000-8000-000000000301';
const TIER_ID = '00000000-0000-4000-8000-000000000311';
const STATION_ID = '00000000-0000-4000-8000-000000031107';
const BOOKING_ID = '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c';

/** Wednesday 4 November 2026, 15:30 IST. */
const NOW = '2026-11-04T10:00:00Z';
/** Thursday 5 November 2026, 10:00 IST: aligned, 18.5 hours ahead. */
const START = '2026-11-05T04:30:00Z';

const validRequest = {
  cafeId: CAFE_ID,
  tierId: TIER_ID,
  startsAt: START,
  durationMinutes: 60,
  seatCount: 2,
};

function codesOf(result: Result<unknown, ValidationIssue[]>): string[] {
  return result.ok ? [] : result.error.map((issue) => issue.code);
}

function pathsOf(result: Result<unknown, ValidationIssue[]>): string[] {
  return result.ok ? [] : result.error.map((issue) => issue.path);
}

describe('booking schemas', () => {
  it('AvailabilitySlot has a start and a whole number of free seats', () => {
    expect(AvailabilitySlot.safeParse({ startsAt: START, freeSeats: 3 }).success).toBe(true);
    expect(AvailabilitySlot.safeParse({ startsAt: START, freeSeats: -1 }).success).toBe(false);
    expect(AvailabilitySlot.safeParse({ startsAt: START, freeSeats: 1.5 }).success).toBe(false);
  });

  it('AvailabilityRequest leaves stepMinutes optional', () => {
    const base = { tierId: TIER_ID, day: '2026-11-20', durationMinutes: 60 };
    expect(AvailabilityRequest.parse(base)).toEqual(base);
    expect(AvailabilityRequest.parse({ ...base, stepMinutes: 60 })).toEqual({
      ...base,
      stepMinutes: 60,
    });
    expect(AvailabilityRequest.safeParse({ ...base, day: '20-11-2026' }).success).toBe(false);
  });

  it('BookingRequest requires whole seats and minutes', () => {
    expect(BookingRequest.parse(validRequest)).toEqual(validRequest);
    expect(BookingRequest.safeParse({ ...validRequest, seatCount: 2.5 }).success).toBe(false);
    expect(BookingRequest.safeParse({ ...validRequest, durationMinutes: 59.5 }).success).toBe(
      false,
    );
  });

  it('BookingSeat and Booking parse the hold-time snapshot', () => {
    const seat = { stationId: STATION_ID, stationLabel: 'STD-07', releasedAt: null };
    expect(BookingSeat.parse(seat)).toEqual(seat);
    const booking = {
      id: BOOKING_ID,
      cafe: { id: CAFE_ID, slug: 'pixel-den-koramangala', name: 'Pixel Den' },
      tier: { id: TIER_ID, name: 'Standard PC', kind: 'pc' },
      status: 'held',
      startsAt: START,
      endsAt: '2026-11-05T05:30:00Z',
      seatCount: 1,
      hourlyRatePaise: 8000,
      totalPaise: 8000,
      lockFeePaise: 0,
      holdExpiresAt: '2026-11-04T10:10:00Z',
      source: 'app',
      seats: [seat],
      createdAt: NOW,
    };
    expect(Booking.parse(booking)).toEqual(booking);
    expect(Booking.safeParse({ ...booking, status: 'pending' }).success).toBe(false);
    expect(Booking.safeParse({ ...booking, tier: { ...booking.tier, kind: 'ps4' } }).success).toBe(
      false,
    );
  });
});

describe('validateBookingRequest', () => {
  it('accepts a well-formed request inside the rules', () => {
    expect(validateBookingRequest(validRequest, NOW)).toEqual({ ok: true, value: validRequest });
  });

  it('accepts the extremes of every rule', () => {
    expect(validateBookingRequest({ ...validRequest, durationMinutes: 30 }, NOW).ok).toBe(true);
    expect(validateBookingRequest({ ...validRequest, durationMinutes: 360 }, NOW).ok).toBe(true);
    expect(validateBookingRequest({ ...validRequest, seatCount: 1 }, NOW).ok).toBe(true);
    expect(validateBookingRequest({ ...validRequest, seatCount: 10 }, NOW).ok).toBe(true);
    // exactly now + 5 minutes
    expect(
      validateBookingRequest(
        { ...validRequest, startsAt: '2026-11-04T10:30:00Z' },
        '2026-11-04T10:25:00Z',
      ).ok,
    ).toBe(true);
    // exactly now + 30 days
    expect(
      validateBookingRequest({ ...validRequest, startsAt: '2026-12-04T10:00:00Z' }, NOW).ok,
    ).toBe(true);
  });

  it('accepts an offset form of an aligned IST start', () => {
    const result = validateBookingRequest(
      { ...validRequest, startsAt: '2026-11-05T10:00:00+05:30' },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it.each([null, undefined, 'book me', 42, [], {}])('rejects the shape of %j', (input) => {
    const result = validateBookingRequest(input, NOW);
    expect(result.ok).toBe(false);
    expect(codesOf(result).every((code) => code === 'invalid_shape')).toBe(true);
    expect(codesOf(result).length).toBeGreaterThan(0);
  });

  it('names the field that fails to parse', () => {
    const { tierId: _tierId, ...withoutTier } = validRequest;
    expect(pathsOf(validateBookingRequest(withoutTier, NOW))).toEqual(['tierId']);
    expect(pathsOf(validateBookingRequest({ ...validRequest, cafeId: 'cafe-1' }, NOW))).toEqual([
      'cafeId',
    ]);
    expect(pathsOf(validateBookingRequest({ ...validRequest, seatCount: 2.5 }, NOW))).toEqual([
      'seatCount',
    ]);
    expect(
      pathsOf(validateBookingRequest({ ...validRequest, startsAt: '2026-11-05 10:00' }, NOW)),
    ).toEqual(['startsAt']);
  });

  it('reports shape issues alone, without running the rules', () => {
    const result = validateBookingRequest({ ...validRequest, seatCount: 'two' }, NOW);
    expect(codesOf(result)).toEqual(['invalid_shape']);
  });

  it.each([
    [0, ['duration_out_of_range']],
    [15, ['duration_out_of_range', 'duration_not_multiple_of_step']],
    [45, ['duration_not_multiple_of_step']],
    [390, ['duration_out_of_range']],
    [-30, ['duration_out_of_range']],
  ])('rejects a duration of %d minutes', (durationMinutes, codes) => {
    const result = validateBookingRequest({ ...validRequest, durationMinutes }, NOW);
    expect(codesOf(result)).toEqual(codes);
    expect(pathsOf(result).every((path) => path === 'durationMinutes')).toBe(true);
  });

  it.each([0, 11, -1])('rejects a seat count of %d', (seatCount) => {
    const result = validateBookingRequest({ ...validRequest, seatCount }, NOW);
    expect(codesOf(result)).toEqual(['seat_count_out_of_range']);
    expect(pathsOf(result)).toEqual(['seatCount']);
  });

  it.each(['2026-11-05T04:45:00Z', '2026-11-05T04:30:30Z', '2026-11-05T04:30:00.500Z'])(
    'rejects a start of %s that is off the 30-minute IST grid',
    (startsAt) => {
      const result = validateBookingRequest({ ...validRequest, startsAt }, NOW);
      expect(codesOf(result)).toEqual(['start_not_aligned']);
      expect(pathsOf(result)).toEqual(['startsAt']);
    },
  );

  it('rejects a start less than five minutes away or in the past', () => {
    expect(
      codesOf(
        validateBookingRequest(
          { ...validRequest, startsAt: '2026-11-04T10:30:00Z' },
          '2026-11-04T10:26:00Z',
        ),
      ),
    ).toEqual(['start_too_soon']);
    expect(
      codesOf(validateBookingRequest({ ...validRequest, startsAt: '2026-11-04T09:30:00Z' }, NOW)),
    ).toEqual(['start_too_soon']);
  });

  it('rejects a start more than thirty days away', () => {
    expect(
      codesOf(validateBookingRequest({ ...validRequest, startsAt: '2026-12-04T10:30:00Z' }, NOW)),
    ).toEqual(['start_too_far']);
  });

  it('collects every failed rule at once', () => {
    const result = validateBookingRequest(
      { ...validRequest, durationMinutes: 45, seatCount: 0, startsAt: '2026-11-05T04:45:00Z' },
      NOW,
    );
    expect(codesOf(result)).toEqual([
      'duration_not_multiple_of_step',
      'seat_count_out_of_range',
      'start_not_aligned',
    ]);
    if (!result.ok) {
      for (const issue of result.error) {
        expect(issue.message.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('quote', () => {
  it('prices per seat and multiplies by seats', () => {
    expect(quote({ hourlyRatePaise: 12_000, durationMinutes: 60, seatCount: 1 })).toEqual({
      perSeatPaise: 12_000,
      totalPaise: 12_000,
    });
    expect(quote({ hourlyRatePaise: 8000, durationMinutes: 90, seatCount: 2 })).toEqual({
      perSeatPaise: 12_000,
      totalPaise: 24_000,
    });
    expect(quote({ hourlyRatePaise: 12_000, durationMinutes: 120, seatCount: 3 })).toEqual({
      perSeatPaise: 24_000,
      totalPaise: 72_000,
    });
  });

  // Pinned with pgTAP 003: round(numeric) in SQL and Math.round here agree on halves.
  it('rounds odd paise like SQL round(numeric)', () => {
    expect(quote({ hourlyRatePaise: 8025, durationMinutes: 30, seatCount: 1 })).toEqual({
      perSeatPaise: 4013,
      totalPaise: 4013,
    });
    expect(quote({ hourlyRatePaise: 8025, durationMinutes: 90, seatCount: 3 })).toEqual({
      perSeatPaise: 12_038,
      totalPaise: 36_114,
    });
  });

  it('rounds the per-seat amount once, before multiplying by seats', () => {
    // 7001 × 30 / 60 = 3500.5 → 3501 per seat; 3 seats are 10 503, not round(10 501.5) = 10 502
    expect(quote({ hourlyRatePaise: 7001, durationMinutes: 30, seatCount: 3 }).totalPaise).toBe(
      10_503,
    );
  });

  it('is zero for a zero duration', () => {
    expect(quote({ hourlyRatePaise: 8000, durationMinutes: 0, seatCount: 4 }).totalPaise).toBe(0);
  });
});

describe('holdExpiresAt', () => {
  it('defaults to ten minutes after now', () => {
    expect(holdExpiresAt(NOW)).toBe('2026-11-04T10:10:00Z');
  });

  it('takes an explicit hold length', () => {
    expect(holdExpiresAt(NOW, 15)).toBe('2026-11-04T10:15:00Z');
  });

  it('keeps the sub-minute part of now', () => {
    expect(holdExpiresAt('2026-11-04T10:00:42.250Z')).toBe('2026-11-04T10:10:42.250Z');
  });
});

describe('canTransition', () => {
  const allowed: readonly (readonly [BookingStatus, BookingStatus])[] = [
    ['held', 'confirmed'],
    ['held', 'cancelled'],
    ['held', 'expired'],
    ['confirmed', 'cancelled'],
    ['confirmed', 'completed'],
    ['confirmed', 'no_show'],
  ];
  const matrix = BookingStatus.options.flatMap((from) =>
    BookingStatus.options.map((to) => [from, to] as const),
  );

  it('covers every pair of statuses', () => {
    expect(matrix).toHaveLength(36);
  });

  it.each(matrix)('%s → %s', (from, to) => {
    const expected = allowed.some(([f, t]) => f === from && t === to);
    expect(canTransition(from, to)).toBe(expected);
  });

  it('allows exactly six transitions', () => {
    expect(matrix.filter(([from, to]) => canTransition(from, to))).toHaveLength(6);
  });
});
