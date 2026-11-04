import {
  addMinutes,
  BOOKING_RULES,
  Booking,
  BookingError,
  holdExpiresAt,
  isOpenDuring,
  quote,
  slotStarts,
  validateBookingRequest,
  type AvailabilityRequest,
  type AvailabilitySlot,
  type BookingRequest,
  type BookingSeat,
  type Cafe,
  type IsoInstant,
  type StationTier,
  type Uuid,
} from '@gog/domain';
import { systemClock, type Clock } from '../clock';
import { instantFromEpochMs } from '../columns';
import {
  bengaluru,
  fixtureId,
  type FixtureDataset,
  type FixtureStation,
} from '../fixtures/bengaluru';
import { sharedFixtureSession, type SessionReader } from '../fixtures/session-store';
import { settle } from '../fixtures/settle';
import { parseAvailabilityRequest } from './availability-request';
import type { BookingRepository } from './repository';

export interface FixtureBookingOptions {
  now?: Clock;
  /** Who is calling; defaults to the store the fixture auth gateway writes. */
  session?: SessionReader;
  data?: FixtureDataset;
}

interface StoredBooking {
  userId: Uuid;
  booking: Booking;
}

interface LocatedTier {
  cafe: Cafe;
  tier: StationTier;
}

/**
 * The booking flow in memory (ADR 0012), following `create_booking`, `confirm_booking`,
 * `cancel_booking` and `expire_holds` of spec 03 step by step so the contract suite passes against
 * both implementations: the same checks in the same order with the same error codes, the per-caller
 * caps of `BOOKING_RULES`, station counts and overlaps honoured, lowest labels allocated first,
 * prices from the domain `quote`, and a sweep of lapsed holds before every operation (what pg_cron
 * plus lazy expiry achieve in SQL). Ids are deterministic (`…-000000900001`, `…-000000900002`, …).
 */
export class FixtureBookingRepository implements BookingRepository {
  private readonly now: Clock;
  private readonly session: SessionReader;
  private readonly data: FixtureDataset;
  private readonly bookings = new Map<Uuid, StoredBooking>();
  private sequence = 0;

  constructor(options: FixtureBookingOptions = {}) {
    this.now = options.now ?? systemClock;
    this.session = options.session ?? sharedFixtureSession;
    this.data = options.data ?? bengaluru;
  }

  getAvailability(request: AvailabilityRequest): Promise<AvailabilitySlot[]> {
    return settle(() => this.availability(request));
  }

  createHold(request: BookingRequest): Promise<Booking> {
    return settle(() => this.hold(request));
  }

  confirm(bookingId: Uuid): Promise<Booking> {
    return settle(() => this.confirmHold(bookingId));
  }

  cancel(bookingId: Uuid): Promise<Booking> {
    return settle(() => this.cancelBooking(bookingId));
  }

  listMine(): Promise<Booking[]> {
    return settle(() => {
      const userId = this.session.get()?.userId;
      if (userId === undefined) {
        // Under RLS an anonymous reader gets zero rows, not an error.
        return [];
      }
      this.sweep();
      return [...this.bookings.values()]
        .filter((stored) => stored.userId === userId)
        .map((stored) => stored.booking)
        .sort(
          (a, b) =>
            Date.parse(b.startsAt) - Date.parse(a.startsAt) ||
            Date.parse(b.createdAt) - Date.parse(a.createdAt),
        )
        .map((booking) => Booking.parse(booking));
    });
  }

  /** `get_availability`: zero rows for an unknown tier, a non-live cafe or a closed weekday. */
  private availability(request: AvailabilityRequest): AvailabilitySlot[] {
    const { tierId, day, durationMinutes, stepMinutes } = parseAvailabilityRequest(request);
    this.sweep();
    const located = this.locateTier(tierId);
    if (located?.cafe.status !== 'live') {
      return [];
    }
    const stations = this.stationsOf(located.tier.id);
    return slotStarts(located.cafe.hours, day, { durationMinutes, stepMinutes }).map(
      (startsAt) => ({
        startsAt,
        freeSeats: this.freeStations(stations, startsAt, addMinutes(startsAt, durationMinutes))
          .length,
      }),
    );
  }

  /** `create_booking` steps 1–8 (spec 03). */
  private hold(request: BookingRequest): Booking {
    const userId = this.requireUser();
    const now = this.now();
    const validated = validateBookingRequest(request, now);
    if (!validated.ok) {
      throw new BookingError(
        'invalid_request',
        validated.error.map((issue) => issue.message).join('; '),
      );
    }
    const { cafeId, tierId, durationMinutes, seatCount } = validated.value;
    const startsAt = instantFromEpochMs(Date.parse(validated.value.startsAt));
    const endsAt = addMinutes(startsAt, durationMinutes);

    const cafe = this.data.cafes.find((candidate) => candidate.id === cafeId);
    if (cafe?.status !== 'live') {
      throw new BookingError('cafe_not_bookable', 'cafe is not bookable');
    }
    const tier = cafe.tiers.find((candidate) => candidate.id === tierId);
    if (tier === undefined) {
      throw new BookingError('cafe_not_bookable', 'tier does not belong to this cafe');
    }
    if (!isOpenDuring(cafe.hours, startsAt, endsAt)) {
      throw new BookingError('outside_hours', 'outside opening hours');
    }

    // Step 5: per-caller caps, checked in the same order as SQL so error precedence matches.
    this.sweep();
    const mine = [...this.bookings.values()]
      .filter((stored) => stored.userId === userId)
      .map((stored) => stored.booking);
    const nowMs = Date.parse(now);
    const isLiveHold = (booking: Booking): boolean =>
      booking.status === 'held' &&
      booking.holdExpiresAt !== null &&
      Date.parse(booking.holdExpiresAt) > nowMs;
    if (mine.filter(isLiveHold).length >= BOOKING_RULES.maxLiveHolds) {
      throw new BookingError('limit_reached', 'too many live holds, confirm or cancel one first');
    }
    const upcoming = mine.filter(
      (booking) =>
        Date.parse(booking.startsAt) > nowMs &&
        (booking.status === 'confirmed' || isLiveHold(booking)),
    );
    if (upcoming.length >= BOOKING_RULES.maxUpcomingBookings) {
      throw new BookingError('limit_reached', 'too many upcoming bookings');
    }

    const stations = this.freeStations(this.stationsOf(tier.id), startsAt, endsAt).slice(
      0,
      seatCount,
    );
    if (stations.length < seatCount) {
      throw new BookingError('not_enough_seats', 'not enough free seats');
    }

    const booking = Booking.parse({
      id: this.nextId(),
      cafe: { id: cafe.id, slug: cafe.slug, name: cafe.name },
      tier: { id: tier.id, name: tier.name, kind: tier.kind },
      status: 'held',
      startsAt,
      endsAt,
      seatCount,
      hourlyRatePaise: tier.hourlyRatePaise,
      totalPaise: quote({ hourlyRatePaise: tier.hourlyRatePaise, durationMinutes, seatCount })
        .totalPaise,
      lockFeePaise: 0,
      holdExpiresAt: holdExpiresAt(now),
      source: 'app',
      seats: stations.map((station): BookingSeat => ({
        stationId: station.id,
        stationLabel: station.label,
        releasedAt: null,
      })),
      createdAt: now,
    });
    this.bookings.set(booking.id, { userId, booking });
    return Booking.parse(booking);
  }

  /** `confirm_booking`: owner only (`GG007`), live hold only (`GG008`). */
  private confirmHold(bookingId: Uuid): Booking {
    const userId = this.requireUser();
    this.sweep();
    const stored = this.bookings.get(bookingId);
    if (stored?.userId !== userId) {
      throw new BookingError('not_found', 'booking not found');
    }
    const { booking } = stored;
    if (
      booking.status !== 'held' ||
      booking.holdExpiresAt === null ||
      Date.parse(booking.holdExpiresAt) <= Date.parse(this.now())
    ) {
      throw new BookingError('invalid_state', 'booking is not a live hold');
    }
    stored.booking = { ...booking, status: 'confirmed', holdExpiresAt: null };
    return Booking.parse(stored.booking);
  }

  /** `cancel_booking`: owner only here (the fixture has no cafe members), held or confirmed. */
  private cancelBooking(bookingId: Uuid): Booking {
    const userId = this.requireUser();
    this.sweep();
    const stored = this.bookings.get(bookingId);
    if (stored?.userId !== userId) {
      throw new BookingError('not_found', 'booking not found');
    }
    const { booking } = stored;
    if (booking.status !== 'held' && booking.status !== 'confirmed') {
      throw new BookingError('invalid_state', 'booking cannot be cancelled from its current state');
    }
    stored.booking = {
      ...booking,
      status: 'cancelled',
      seats: releaseSeats(booking.seats, this.now()),
    };
    return Booking.parse(stored.booking);
  }

  /** `expire_holds`: lapsed holds become `expired` and their seats are released. */
  private sweep(): void {
    const now = this.now();
    const nowMs = Date.parse(now);
    for (const stored of this.bookings.values()) {
      const { booking } = stored;
      if (
        booking.status === 'held' &&
        booking.holdExpiresAt !== null &&
        Date.parse(booking.holdExpiresAt) <= nowMs
      ) {
        stored.booking = { ...booking, status: 'expired', seats: releaseSeats(booking.seats, now) };
      }
    }
  }

  private requireUser(): Uuid {
    const session = this.session.get();
    if (session === null) {
      throw new BookingError('auth_required', 'authentication required');
    }
    return session.userId;
  }

  private locateTier(tierId: Uuid): LocatedTier | null {
    for (const cafe of this.data.cafes) {
      const tier = cafe.tiers.find((candidate) => candidate.id === tierId);
      if (tier !== undefined) {
        return { cafe, tier };
      }
    }
    return null;
  }

  /** Active stations of a tier, lowest label first (the allocation order of `create_booking`). */
  private stationsOf(tierId: Uuid): FixtureStation[] {
    return this.data.stations
      .filter((station) => station.tierId === tierId && station.isActive)
      .sort((a, b) => a.label.localeCompare(b.label, 'en'));
  }

  private freeStations(
    stations: FixtureStation[],
    startsAt: IsoInstant,
    endsAt: IsoInstant,
  ): FixtureStation[] {
    const startMs = Date.parse(startsAt);
    const endMs = Date.parse(endsAt);
    return stations.filter((station) => !this.isStationTaken(station.id, startMs, endMs));
  }

  /** An unreleased seat on the station whose booking range overlaps `[start, end)`. */
  private isStationTaken(stationId: Uuid, startMs: number, endMs: number): boolean {
    for (const { booking } of this.bookings.values()) {
      const overlaps = Date.parse(booking.startsAt) < endMs && startMs < Date.parse(booking.endsAt);
      if (
        overlaps &&
        booking.seats.some((seat) => seat.stationId === stationId && seat.releasedAt === null)
      ) {
        return true;
      }
    }
    return false;
  }

  private nextId(): Uuid {
    this.sequence += 1;
    return fixtureId(`9${this.sequence.toString().padStart(5, '0')}`);
  }
}

function releaseSeats(seats: BookingSeat[], releasedAt: IsoInstant): BookingSeat[] {
  return seats.map((seat) => (seat.releasedAt === null ? { ...seat, releasedAt } : seat));
}
