import { describe, expect, it } from 'vitest';
import { canTransition, quote, validateBookingRequest, type Booking } from './booking';
import type { OpeningHours } from './entities';
import { isOpenDuring, openingWindowFor, slotStarts } from './hours';
import { addDays, addMinutes, istToInstant, minutesBetween } from './time';

/**
 * The five invariants of spec 02, checked across the module boundaries that uphold them.
 */

const CAFE_ID = '00000000-0000-4000-8000-000000000301';
const TIER_ID = '00000000-0000-4000-8000-000000000311';
const STATION_ID = '00000000-0000-4000-8000-000000031107';

const FRIDAY_NIGHT: OpeningHours[] = [
  { weekday: 5, opensAt: '22:00', closesAt: '02:00', isOvernight: true },
  { weekday: 6, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
];

const WEEKEND_LATE: OpeningHours[] = [
  ...[0, 1, 2, 3, 4].map((weekday) => ({
    weekday,
    opensAt: '10:00',
    closesAt: '23:00',
    isOvernight: false,
  })),
  ...[5, 6].map((weekday) => ({ weekday, opensAt: '10:00', closesAt: '02:00', isOvernight: true })),
];

const FRIDAY = '2026-11-20';

function heldBooking(startsAt: string, durationMinutes: number, seatCount: number): Booking {
  const hourlyRatePaise = 8025;
  return {
    id: '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c',
    cafe: { id: CAFE_ID, slug: 'pixel-den-koramangala', name: 'Pixel Den' },
    tier: { id: TIER_ID, name: 'Standard PC', kind: 'pc' },
    status: 'held',
    startsAt,
    endsAt: addMinutes(startsAt, durationMinutes),
    seatCount,
    hourlyRatePaise,
    totalPaise: quote({ hourlyRatePaise, durationMinutes, seatCount }).totalPaise,
    lockFeePaise: 0,
    holdExpiresAt: '2026-11-04T10:10:00Z',
    source: 'app',
    seats: Array.from({ length: seatCount }, (_, index) => ({
      stationId: STATION_ID,
      stationLabel: `STD-${(index + 1).toString().padStart(2, '0')}`,
      releasedAt: null,
    })),
    createdAt: '2026-11-04T10:00:00Z',
  };
}

describe('invariant 1: endsAt is startsAt + duration and inside opening hours', () => {
  it('holds for a request validated against the rules and the hours', () => {
    const startsAt = istToInstant(FRIDAY, 22 * 60 + 30);
    const request = {
      cafeId: CAFE_ID,
      tierId: TIER_ID,
      startsAt,
      durationMinutes: 90,
      seatCount: 3,
    };
    const validated = validateBookingRequest(request, '2026-11-19T10:00:00Z');
    expect(validated.ok).toBe(true);

    const booking = heldBooking(startsAt, 90, 3);
    expect(minutesBetween(booking.startsAt, booking.endsAt)).toBe(90);
    expect(booking.endsAt).toBe(istToInstant(addDays(FRIDAY, 1), 0));
    expect(isOpenDuring(FRIDAY_NIGHT, booking.startsAt, booking.endsAt)).toBe(true);
  });

  it('fails for a session that runs past closing', () => {
    const startsAt = istToInstant(FRIDAY, 22 * 60);
    const booking = heldBooking(startsAt, 300, 1);
    expect(minutesBetween(booking.startsAt, booking.endsAt)).toBe(300);
    expect(isOpenDuring(FRIDAY_NIGHT, booking.startsAt, booking.endsAt)).toBe(false);
  });
});

describe('invariant 2: totalPaise is the quote of the copied rate over the booked range', () => {
  it.each([
    [30, 1, 4013],
    [90, 3, 36_114],
    [60, 2, 16_050],
    [360, 10, 481_500],
  ])('%d minutes × %d seats totals %d paise', (durationMinutes, seatCount, expectedTotal) => {
    const booking = heldBooking(istToInstant(FRIDAY, 22 * 60), durationMinutes, seatCount);
    const recomputed = quote({
      hourlyRatePaise: booking.hourlyRatePaise,
      durationMinutes: minutesBetween(booking.startsAt, booking.endsAt),
      seatCount: booking.seatCount,
    });
    expect(booking.totalPaise).toBe(expectedTotal);
    expect(booking.totalPaise).toBe(recomputed.totalPaise);
  });

  it('is checkable from the booking alone when the tier price changes later', () => {
    const booking = heldBooking(istToInstant(FRIDAY, 22 * 60), 60, 2);
    const repricedTier = { hourlyRatePaise: 9000 };
    expect(
      quote({ hourlyRatePaise: repricedTier.hourlyRatePaise, durationMinutes: 60, seatCount: 2 })
        .totalPaise,
    ).not.toBe(booking.totalPaise);
    expect(
      quote({ hourlyRatePaise: booking.hourlyRatePaise, durationMinutes: 60, seatCount: 2 })
        .totalPaise,
    ).toBe(booking.totalPaise);
  });
});

describe('invariant 3: status transitions follow canTransition', () => {
  it('walks the happy path and the hold path', () => {
    expect(canTransition('held', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'completed')).toBe(true);
    expect(canTransition('held', 'expired')).toBe(true);
  });

  it('never leaves a terminal state or skips confirmation', () => {
    for (const terminal of ['cancelled', 'expired', 'completed', 'no_show'] as const) {
      for (const to of [
        'held',
        'confirmed',
        'cancelled',
        'expired',
        'completed',
        'no_show',
      ] as const) {
        expect(canTransition(terminal, to)).toBe(false);
      }
    }
    expect(canTransition('held', 'completed')).toBe(false);
    expect(canTransition('held', 'no_show')).toBe(false);
    expect(canTransition('confirmed', 'held')).toBe(false);
    expect(canTransition('confirmed', 'expired')).toBe(false);
  });
});

describe('invariant 4: slot starts never produce a session that ends after closing', () => {
  it('holds for every day, duration and step over the sample hours', () => {
    const week = Array.from({ length: 7 }, (_, offset) => addDays('2026-11-22', offset));
    let checked = 0;
    for (const hours of [FRIDAY_NIGHT, WEEKEND_LATE]) {
      for (const day of week) {
        const window = openingWindowFor(hours, day);
        for (const durationMinutes of [30, 60, 90, 120, 180, 240, 300, 360]) {
          for (const stepMinutes of [30, 60]) {
            for (const start of slotStarts(hours, day, { durationMinutes, stepMinutes })) {
              expect(window).not.toBeNull();
              const endsAt = addMinutes(start, durationMinutes);
              expect(minutesBetween(endsAt, window?.closesAt ?? start)).toBeGreaterThanOrEqual(0);
              expect(isOpenDuring(hours, start, endsAt)).toBe(true);
              checked += 1;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe('invariant 5: a Friday 22:00–02:00 window contains Saturday 00:30–01:30 IST', () => {
  const saturdayStart = istToInstant(addDays(FRIDAY, 1), 30);
  const saturdayEnd = istToInstant(addDays(FRIDAY, 1), 90);

  it('in UTC terms', () => {
    expect(saturdayStart).toBe('2026-11-20T19:00:00Z');
    expect(saturdayEnd).toBe('2026-11-20T20:00:00Z');
    expect(openingWindowFor(FRIDAY_NIGHT, FRIDAY)).toEqual({
      opensAt: '2026-11-20T16:30:00Z',
      closesAt: '2026-11-20T20:30:00Z',
    });
  });

  it('is open during the session although it starts on Saturday', () => {
    expect(isOpenDuring(FRIDAY_NIGHT, saturdayStart, saturdayEnd)).toBe(true);
  });

  it('lists the session as a Friday slot, not a Saturday one', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60 })).toContain(saturdayStart);
    expect(slotStarts(FRIDAY_NIGHT, addDays(FRIDAY, 1), { durationMinutes: 60 })).not.toContain(
      saturdayStart,
    );
  });

  it('stops containing the session once it crosses 02:00', () => {
    expect(isOpenDuring(FRIDAY_NIGHT, saturdayStart, addMinutes(saturdayEnd, 60))).toBe(false);
  });
});
