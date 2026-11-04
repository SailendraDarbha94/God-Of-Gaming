import { BookingError, type IsoInstant } from '@gog/domain';
import { describe, expect, it } from 'vitest';
import { userIdForPhone } from '../auth/fixture-auth';
import type { Clock } from '../clock';
import { instantFromEpochMs } from '../columns';
import { fixtureId } from '../fixtures/bengaluru';
import { FixtureSessionStore } from '../fixtures/session-store';
import { describeBookingRepository } from '../testing/booking-contract';
import { FixtureBookingRepository } from './fixture-booking';

const MINUTE_MS = 60_000;

/** A clock the tests move by hand; `now` is a property so it can be passed around unbound. */
class FakeClock {
  private epochMs: number;

  constructor(start: IsoInstant) {
    this.epochMs = Date.parse(start);
  }

  readonly now: Clock = () => instantFromEpochMs(this.epochMs);

  readonly advance = (minutes: number): void => {
    this.epochMs += minutes * MINUTE_MS;
  };
}

/** Tuesday 10 November 2026, 10:00 IST. */
const START: IsoInstant = '2026-11-10T04:30:00Z';
const PHONE = '919999900001';

function signedIn(): FixtureSessionStore {
  const store = new FixtureSessionStore();
  store.set({ userId: userIdForPhone(PHONE), phone: PHONE, expiresAt: null });
  return store;
}

describeBookingRepository('FixtureBookingRepository', () => {
  const clock = new FakeClock(START);
  return {
    repository: new FixtureBookingRepository({ now: clock.now, session: signedIn() }),
    now: clock.now,
    advanceMinutes: clock.advance,
    signedOut: new FixtureBookingRepository({ now: clock.now, session: new FixtureSessionStore() }),
  };
});

describe('FixtureBookingRepository specifics', () => {
  /** Pixel Den, Standard PC, Tuesday 17 November 2026 14:00 IST. */
  const request = {
    cafeId: fixtureId(301),
    tierId: fixtureId(311),
    startsAt: '2026-11-17T08:30:00Z',
    durationMinutes: 60,
    seatCount: 2,
  };

  it('allocates the lowest labels first with deterministic ids', async () => {
    const repository = new FixtureBookingRepository({
      now: new FakeClock(START).now,
      session: signedIn(),
    });
    const first = await repository.createHold(request);
    const second = await repository.createHold({ ...request, seatCount: 1 });
    expect(first.id).toBe(fixtureId(900001));
    expect(second.id).toBe(fixtureId(900002));
    expect(first.seats.map((seat) => seat.stationLabel)).toEqual(['STD-01', 'STD-02']);
    expect(first.seats.map((seat) => seat.stationId)).toEqual([fixtureId(31101), fixtureId(31102)]);
    expect(second.seats.map((seat) => seat.stationLabel)).toEqual(['STD-03']);
    expect(first.holdExpiresAt).toBe('2026-11-10T04:40:00Z');
    expect(first.createdAt).toBe(START);
  });

  it('lets a lapsed hold free its seats for the next squad', async () => {
    const clock = new FakeClock(START);
    const repository = new FixtureBookingRepository({ now: clock.now, session: signedIn() });
    await repository.createHold({ ...request, seatCount: 10 });
    await repository.createHold({ ...request, seatCount: 2 });
    await expect(repository.createHold({ ...request, seatCount: 1 })).rejects.toMatchObject({
      code: 'not_enough_seats',
    });
    clock.advance(11);
    const squad = await repository.createHold({ ...request, seatCount: 10 });
    expect(squad.seats.map((seat) => seat.stationLabel)).toEqual(
      Array.from({ length: 10 }, (_, index) => `STD-${(index + 1).toString().padStart(2, '0')}`),
    );
  });

  it('keeps bookings of different users apart', async () => {
    const clock = new FakeClock(START);
    const alice = signedIn();
    const bob = new FixtureSessionStore();
    bob.set({ userId: userIdForPhone('919999900002'), phone: '919999900002', expiresAt: null });
    const asAlice = new FixtureBookingRepository({ now: clock.now, session: alice });
    const held = await asAlice.createHold(request);

    // Bob shares no store with Alice here, so he sees nothing of hers and cannot touch it.
    const asBob = new FixtureBookingRepository({ now: clock.now, session: bob });
    expect(await asBob.listMine()).toEqual([]);
    await expect(asBob.confirm(held.id)).rejects.toBeInstanceOf(BookingError);
    expect(await asAlice.listMine()).toHaveLength(1);
  });
});
