import {
  addDays,
  addMinutes,
  BOOKING_RULES,
  Booking,
  BookingError,
  instantToIst,
  istToInstant,
  minutesBetween,
  quote,
  slotStarts,
  type BookingErrorCode,
  type IsoInstant,
  type LocalDate,
  type Uuid,
} from '@gog/domain';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { BookingRepository } from '../booking/repository';
import { bengaluru, fixtureId } from '../fixtures/bengaluru';

export interface BookingContractHarness {
  /** A repository whose caller is signed in. */
  repository: BookingRepository;
  /** The clock the repository reads; the suite builds every request relative to it. */
  now(): IsoInstant;
  /** Moves that clock forward. In-memory implementations only; the expiry test skips without it. */
  advanceMinutes?: (minutes: number) => void;
  /** A repository over the same backend whose caller is signed out; the auth test skips without it. */
  signedOut?: BookingRepository;
}

export type BookingHarnessFactory = () => BookingContractHarness | Promise<BookingContractHarness>;

function must<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Missing ${what}`);
  }
  return value;
}

/** Pixel Den's Standard PC tier: twelve stations, Rs 80 an hour, open from 10:00 every day. */
const PIXEL_DEN = must(
  bengaluru.cafes.find((cafe) => cafe.slug === 'pixel-den-koramangala'),
  'Pixel Den',
);
const STANDARD_PC = must(
  PIXEL_DEN.tiers.find((tier) => tier.name === 'Standard PC'),
  'Standard PC tier',
);
const FRAME_RATE_PRO_PC = fixtureId(321);
const UNKNOWN_ID = fixtureId(999);
const DURATION = 60;

async function rejectionOf(action: Promise<unknown>): Promise<unknown> {
  try {
    await action;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the action to reject');
}

async function expectBookingError(action: Promise<unknown>, code: BookingErrorCode): Promise<void> {
  const error = await rejectionOf(action);
  expect(error).toBeInstanceOf(BookingError);
  expect(error).toMatchObject({ code });
}

/**
 * The behaviour every `BookingRepository` must share (ADR 0005, 0012), run against the fixture and,
 * when a stack is configured, the Supabase implementation. Requests are placed one week after the
 * harness clock on Pixel Den's Standard PC tier, each test at its own hour so they never overlap:
 * 14:00 and 16:00 for the lifecycle, 20:00 for capacity, 17:00 to 19:00 and 21:00 for the per-account
 * cap, 12:00 for expiry. Every hold is cancelled again, so the caller ends each test without a live
 * hold. A Supabase target must be seeded and quiet (no other holds on that tier a week ahead, and no
 * live holds by the test user) for the seat counts and the cap to hold.
 */
export function describeBookingRepository(name: string, factory: BookingHarnessFactory): void {
  describe(name, () => {
    let harness: BookingContractHarness;
    /** The opening day the suite books: a week ahead, inside the lead-time rules. */
    let day: LocalDate;
    const created: Uuid[] = [];

    const at = (minutesFromMidnight: number): IsoInstant => istToInstant(day, minutesFromMidnight);

    const hold = async (
      startMinutes: number,
      seatCount: number,
      ids: { cafeId?: Uuid; tierId?: Uuid } = {},
    ): Promise<Booking> => {
      const booking = await harness.repository.createHold({
        cafeId: ids.cafeId ?? PIXEL_DEN.id,
        tierId: ids.tierId ?? STANDARD_PC.id,
        startsAt: at(startMinutes),
        durationMinutes: DURATION,
        seatCount,
      });
      created.push(booking.id);
      return booking;
    };

    const freeSeatsAt = async (startMinutes: number): Promise<number> => {
      const slots = await harness.repository.getAvailability({
        tierId: STANDARD_PC.id,
        day,
        durationMinutes: DURATION,
      });
      return must(
        slots.find((slot) => slot.startsAt === at(startMinutes)),
        `slot at ${at(startMinutes)}`,
      ).freeSeats;
    };

    beforeAll(async () => {
      harness = await factory();
      day = addDays(instantToIst(harness.now()).day, 7);
    });

    afterAll(async () => {
      // Leave a shared backend as it was found; terminal bookings reject and that is fine.
      for (const id of created) {
        try {
          await harness.repository.cancel(id);
        } catch {
          // already cancelled or expired
        }
      }
    });

    describe('getAvailability', () => {
      it('lists every start of the opening day for the requested duration and step', async () => {
        const slots = await harness.repository.getAvailability({
          tierId: STANDARD_PC.id,
          day,
          durationMinutes: DURATION,
        });
        expect(slots.map((slot) => slot.startsAt)).toEqual(
          slotStarts(PIXEL_DEN.hours, day, { durationMinutes: DURATION }),
        );
        for (const slot of slots) {
          expect(slot.freeSeats).toBeGreaterThanOrEqual(0);
          expect(slot.freeSeats).toBeLessThanOrEqual(STANDARD_PC.stationCount);
        }

        const hourly = await harness.repository.getAvailability({
          tierId: STANDARD_PC.id,
          day,
          durationMinutes: 120,
          stepMinutes: 60,
        });
        expect(hourly.map((slot) => slot.startsAt)).toEqual(
          slotStarts(PIXEL_DEN.hours, day, { durationMinutes: 120, stepMinutes: 60 }),
        );
      });

      it('returns no slots for an unknown tier', async () => {
        expect(
          await harness.repository.getAvailability({
            tierId: UNKNOWN_ID,
            day,
            durationMinutes: DURATION,
          }),
        ).toEqual([]);
      });

      it('rejects a non-positive duration or step', async () => {
        await expectBookingError(
          harness.repository.getAvailability({ tierId: STANDARD_PC.id, day, durationMinutes: 0 }),
          'invalid_request',
        );
        await expectBookingError(
          harness.repository.getAvailability({
            tierId: STANDARD_PC.id,
            day,
            durationMinutes: DURATION,
            stepMinutes: 0,
          }),
          'invalid_request',
        );
      });

      it('rejects a malformed tier id or day as an invalid request, never as unknown', async () => {
        await expectBookingError(
          harness.repository.getAvailability({
            tierId: 'not-a-uuid',
            day,
            durationMinutes: DURATION,
          }),
          'invalid_request',
        );
        await expectBookingError(
          harness.repository.getAvailability({
            tierId: STANDARD_PC.id,
            day: '20-11-2026',
            durationMinutes: DURATION,
          }),
          'invalid_request',
        );
      });
    });

    describe('hold lifecycle', () => {
      const FIRST = 14 * 60;
      const SECOND = 16 * 60;
      let freeAtFirst: number;
      let freeAtSecond: number;
      let first: Booking;
      let second: Booking;

      beforeAll(async () => {
        freeAtFirst = await freeSeatsAt(FIRST);
        freeAtSecond = await freeSeatsAt(SECOND);
      });

      it('holds seats for a squad and prices them from the copied rate', async () => {
        first = await hold(FIRST, 2);
        expect(() => Booking.parse(first)).not.toThrow();
        expect(first).toMatchObject({
          status: 'held',
          source: 'app',
          seatCount: 2,
          hourlyRatePaise: STANDARD_PC.hourlyRatePaise,
          lockFeePaise: 0,
          startsAt: at(FIRST),
          endsAt: at(FIRST + DURATION),
          cafe: { id: PIXEL_DEN.id, slug: PIXEL_DEN.slug, name: PIXEL_DEN.name },
          tier: { id: STANDARD_PC.id, name: STANDARD_PC.name, kind: STANDARD_PC.kind },
        });
        expect(first.totalPaise).toBe(
          quote({
            hourlyRatePaise: STANDARD_PC.hourlyRatePaise,
            durationMinutes: DURATION,
            seatCount: 2,
          }).totalPaise,
        );
        expect(first.seats).toHaveLength(2);
        expect(new Set(first.seats.map((seat) => seat.stationId)).size).toBe(2);
        for (const seat of first.seats) {
          expect(seat.stationLabel).toMatch(/^STD-\d{2}$/);
          expect(seat.releasedAt).toBeNull();
        }
        const minutesLeft = minutesBetween(
          harness.now(),
          must(first.holdExpiresAt, 'holdExpiresAt'),
        );
        expect(minutesLeft).toBeGreaterThanOrEqual(BOOKING_RULES.holdMinutes - 1);
        expect(minutesLeft).toBeLessThanOrEqual(BOOKING_RULES.holdMinutes);
      });

      it('subtracts the held seats only where the hold overlaps', async () => {
        expect(await freeSeatsAt(FIRST)).toBe(freeAtFirst - 2);
        expect(await freeSeatsAt(FIRST - 30)).toBe(freeAtFirst - 2);
        expect(await freeSeatsAt(SECOND)).toBe(freeAtSecond);
      });

      it("lists the caller's bookings newest start first", async () => {
        second = await hold(SECOND, 1);
        const mine = await harness.repository.listMine();
        const ids = mine.map((booking) => booking.id);
        expect(ids).toContain(first.id);
        expect(ids).toContain(second.id);
        expect(ids.indexOf(second.id)).toBeLessThan(ids.indexOf(first.id));
        const starts = mine.map((booking) => Date.parse(booking.startsAt));
        expect(starts).toEqual([...starts].sort((a, b) => b - a));
        for (const booking of mine) {
          expect(() => Booking.parse(booking)).not.toThrow();
        }
      });

      it('confirms a live hold once', async () => {
        const confirmed = await harness.repository.confirm(first.id);
        expect(confirmed).toMatchObject({
          id: first.id,
          status: 'confirmed',
          holdExpiresAt: null,
          seatCount: 2,
          totalPaise: first.totalPaise,
        });
        expect(confirmed.seats.map((seat) => seat.stationId).sort()).toEqual(
          first.seats.map((seat) => seat.stationId).sort(),
        );
        await expectBookingError(harness.repository.confirm(first.id), 'invalid_state');
      });

      it('cancels a confirmed booking and frees its seats', async () => {
        const cancelled = await harness.repository.cancel(first.id);
        expect(cancelled.status).toBe('cancelled');
        expect(cancelled.seats).toHaveLength(2);
        for (const seat of cancelled.seats) {
          expect(seat.releasedAt).not.toBeNull();
        }
        expect(await freeSeatsAt(FIRST)).toBe(freeAtFirst);
        await expectBookingError(harness.repository.cancel(first.id), 'invalid_state');
      });

      it('cancels a hold as well', async () => {
        const cancelled = await harness.repository.cancel(second.id);
        expect(cancelled.status).toBe('cancelled');
        expect(await freeSeatsAt(SECOND)).toBe(freeAtSecond);
        const mine = await harness.repository.listMine();
        expect(mine.find((booking) => booking.id === second.id)?.status).toBe('cancelled');
      });
    });

    describe('rules', () => {
      it('rejects a request the booking rules forbid', async () => {
        const base = {
          cafeId: PIXEL_DEN.id,
          tierId: STANDARD_PC.id,
          startsAt: at(14 * 60),
          durationMinutes: DURATION,
          seatCount: 1,
        };
        const { repository } = harness;
        await expectBookingError(
          repository.createHold({ ...base, durationMinutes: 45 }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, durationMinutes: 390 }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, seatCount: 11 }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, seatCount: 0 }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, startsAt: addMinutes(base.startsAt, 10) }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, startsAt: addMinutes(harness.now(), -60) }),
          'invalid_request',
        );
        await expectBookingError(
          repository.createHold({ ...base, startsAt: istToInstant(addDays(day, 40), 14 * 60) }),
          'invalid_request',
        );
      });

      it('rejects a session outside opening hours', async () => {
        await expectBookingError(hold(8 * 60, 1), 'outside_hours');
        await expectBookingError(hold(9 * 60, 1), 'outside_hours');
      });

      it('rejects an unknown cafe and a tier of another cafe', async () => {
        await expectBookingError(hold(14 * 60, 1, { cafeId: UNKNOWN_ID }), 'cafe_not_bookable');
        await expectBookingError(
          hold(14 * 60, 1, { tierId: FRAME_RATE_PRO_PC }),
          'cafe_not_bookable',
        );
      });

      it('refuses more seats than the tier has free', async () => {
        const squad = await hold(20 * 60, 10);
        expect(squad.seats).toHaveLength(10);
        await expectBookingError(hold(20 * 60, 3), 'not_enough_seats');
        await harness.repository.cancel(squad.id);

        // A re-held slot: equal starts list the newer hold first (created_at breaks the tie).
        harness.advanceMinutes?.(1);
        const again = await hold(20 * 60, 3);
        const ids = (await harness.repository.listMine()).map((booking) => booking.id);
        expect(ids.indexOf(again.id)).toBeLessThan(ids.indexOf(squad.id));
        await harness.repository.cancel(again.id);
      });

      it('caps live holds per account and frees the slot when one is cancelled', async () => {
        // 17:00, 18:00 and 19:00 are used by no other test, so the caller starts with no live hold.
        const holds: Booking[] = [];
        for (let index = 0; index < BOOKING_RULES.maxLiveHolds; index += 1) {
          holds.push(await hold((17 + index) * 60, 1));
        }
        await expectBookingError(hold(21 * 60, 1), 'limit_reached');

        const [first, ...rest] = holds;
        await harness.repository.cancel(must(first, 'first hold').id);
        const replacement = await hold(21 * 60, 1);
        expect(replacement.status).toBe('held');

        for (const booking of [...rest, replacement]) {
          await harness.repository.cancel(booking.id);
        }
      });

      it('reports an unknown booking as not found', async () => {
        await expectBookingError(harness.repository.confirm(UNKNOWN_ID), 'not_found');
        await expectBookingError(harness.repository.cancel(UNKNOWN_ID), 'not_found');
      });
    });

    describe('hold expiry', () => {
      it('frees the seats of a lapsed hold and refuses to confirm it', async ({ skip }) => {
        const advanceMinutes = harness.advanceMinutes;
        if (advanceMinutes === undefined) {
          skip('the harness cannot move time');
          return;
        }
        const START = 12 * 60;
        const before = await freeSeatsAt(START);
        const lapsed = await hold(START, 1);
        expect(await freeSeatsAt(START)).toBe(before - 1);

        advanceMinutes(BOOKING_RULES.holdMinutes + 1);
        expect(await freeSeatsAt(START)).toBe(before);
        await expectBookingError(harness.repository.confirm(lapsed.id), 'invalid_state');
        const mine = await harness.repository.listMine();
        expect(mine.find((booking) => booking.id === lapsed.id)?.status).toBe('expired');
      });
    });

    describe('signed out', () => {
      it('requires a session to hold, confirm or cancel, lists nothing and still shows availability', async ({
        skip,
      }) => {
        const signedOut = harness.signedOut;
        if (signedOut === undefined) {
          skip('the harness has no signed-out repository');
          return;
        }
        await expectBookingError(
          signedOut.createHold({
            cafeId: PIXEL_DEN.id,
            tierId: STANDARD_PC.id,
            startsAt: at(14 * 60),
            durationMinutes: DURATION,
            seatCount: 1,
          }),
          'auth_required',
        );
        await expectBookingError(signedOut.confirm(UNKNOWN_ID), 'auth_required');
        await expectBookingError(signedOut.cancel(UNKNOWN_ID), 'auth_required');
        expect(await signedOut.listMine()).toEqual([]);
        const slots = await signedOut.getAvailability({
          tierId: STANDARD_PC.id,
          day,
          durationMinutes: DURATION,
        });
        expect(slots.length).toBeGreaterThan(0);
      });
    });
  });
}
