/**
 * The data every screen on the board shows. Nothing here is invented: it is the app's own sample
 * dataset (@gog/data fixtures) driven through the app's own repositories on a clock this file
 * controls, so each snapshot is what the player app would hold in that state.
 *
 * The story: it is Saturday 21 November 2026, 6:05 pm in Bengaluru. A player (+91 98765 43210)
 * opens Pixel Den in Koramangala, picks the Standard PC tier, and holds four seats for Sunday
 * 7:30 pm to 9:30 pm, then confirms. Earlier that week they confirmed and played a session,
 * cancelled one, and let one hold run out. They also have a second hold ticking for tonight.
 */
import {
  dayOptions,
  toSlotOptions,
  upcomingStarts,
  type BookingDraft,
  type DayOption,
  type SlotOption,
} from '@app/features/booking/slots';
import { instantFromEpochMs } from '@gog/data/columns';
import {
  createAuthGateway,
  createBookingRepository,
  createCatalogRepository,
} from '@gog/data/factory';
import type { AuthSession } from '@gog/data/auth';
import {
  BOOKING_RULES,
  DEFAULT_CITY_SLUG,
  instantToIst,
  istToInstant,
  type Area,
  type Booking,
  type Cafe,
  type CafeCard,
  type IsoInstant,
  type LocalDate,
  type Minutes,
  type Slug,
  type StationKind,
  type StationTier,
} from '@gog/domain';

/** What useBookingDraft() returns, frozen at one moment (no setters). */
export interface DraftSnapshot {
  durationMinutes: Minutes;
  seatCount: number;
  maxSeats: number;
  days: DayOption[];
  day: LocalDate | null;
  slots: SlotOption[];
  expectedSlotCount: number;
  selectedSlot: SlotOption | null;
}

export interface ExploreFilter {
  areaSlug: Slug | null;
  kind: StationKind | null;
}

export interface Scenario {
  /** "Now" on every screen unless a field below says otherwise: Sat 21 Nov 2026, 6:05 pm IST. */
  now: IsoInstant;
  today: LocalDate;

  // ----- Catalog -----
  areas: Area[];
  /** Explore with no filter: all six cafes, in the repository's order. */
  cafes: CafeCard[];
  /** Explore with the "PlayStation 5" chip on. */
  filtered: { filter: ExploreFilter; cafes: CafeCard[] };
  /** A filter that matches nothing, for the empty state. */
  emptyFilter: ExploreFilter;
  /** The cafe the story follows: Pixel Den, Koramangala. */
  cafe: Cafe;
  /** Every cafe's detail, by slug. */
  cafesBySlug: Readonly<Record<string, Cafe>>;
  /** The tier the story books: Pixel Den's Standard PC. */
  tier: StationTier;

  // ----- Pick a time (book/[tierId]) -----
  /** As the screen opens: 1 h, 1 seat, the first open day, no start chosen. */
  pickInitial: DraftSnapshot;
  /** After the player's choices: Tomorrow, 2 h, 4 seats, 7:30 pm chosen. */
  pickChosen: DraftSnapshot;

  // ----- Session -----
  /** The signed-in player. `phone` is digits without `+`, as profiles store it. */
  session: AuthSession;
  /** What the player typed on the sign-in sheet: ten local digits, then the six-digit code. */
  typedPhone: string;
  typedOtp: string;

  // ----- Bookings -----
  /** The story's booking right after "Hold seats": status held, the timer at 9:00. */
  held: Booking;
  /** The clock for `held`: one minute into the ten-minute hold. */
  heldNow: IsoInstant;
  /** The same booking after "Confirm". */
  confirmed: Booking;
  /** A second live hold for tonight at another cafe, six minutes left at `bookingsNow`. */
  otherHold: Booking;
  /** A hold released by the player (Friday). */
  cancelled: Booking;
  /** A hold that ran out (Saturday morning). */
  expired: Booking;
  /** A confirmed session that has ended (Thursday). */
  past: Booking;
  /** listMine() at the end of the story, newest first: all five bookings above. */
  bookings: Booking[];
  /** The clock for `bookings`: 6:06 pm. */
  bookingsNow: IsoInstant;
}

const MINUTE_MS = 60_000;
const PLAYER_PHONE = '+919876543210';
const OTP = '123456';

function ist(day: LocalDate, hour: number, minute = 0): IsoInstant {
  return istToInstant(day, hour * 60 + minute);
}

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`scenario: missing ${what}`);
  }
  return value;
}

export async function loadScenario(): Promise<Scenario> {
  let nowMs = Date.parse(ist('2026-11-19', 18));
  const clock = (): IsoInstant => instantFromEpochMs(nowMs);
  const setNow = (instant: IsoInstant): void => {
    nowMs = Date.parse(instant);
  };

  const catalog = createCatalogRepository({ source: 'fixtures' });
  const booking = createBookingRepository({ source: 'fixtures', now: clock });
  const auth = createAuthGateway({ source: 'fixtures' });

  const signIn = async (phone: string): Promise<AuthSession> => {
    await auth.signInWithPhone(phone);
    return auth.verifyOtp(phone, OTP);
  };

  // ----- Catalog -----
  const areas = await catalog.listAreas(DEFAULT_CITY_SLUG);
  const cafes = await catalog.listCafes({ citySlug: DEFAULT_CITY_SLUG });
  const cafesBySlug: Record<string, Cafe> = {};
  for (const card of cafes) {
    cafesBySlug[card.slug] = required(await catalog.getCafe(card.slug), `cafe ${card.slug}`);
  }
  const bySlug = (slug: string): Cafe => required(cafesBySlug[slug], `cafe ${slug}`);
  const tierOf = (cafe: Cafe, name: string): StationTier =>
    required(
      cafe.tiers.find((candidate) => candidate.name === name),
      `tier ${name} at ${cafe.name}`,
    );

  const filter: ExploreFilter = { areaSlug: null, kind: 'ps5' };
  const filteredCafes = await catalog.listCafes({ citySlug: DEFAULT_CITY_SLUG, kind: 'ps5' });
  const emptyFilter: ExploreFilter = { areaSlug: 'whitefield', kind: 'ps5' };
  const none = await catalog.listCafes({
    citySlug: DEFAULT_CITY_SLUG,
    areaSlug: 'whitefield',
    kind: 'ps5',
  });
  if (filteredCafes.length < 2 || none.length !== 0) {
    throw new Error('scenario: the sample filters no longer behave as the board assumes');
  }

  const cafe = bySlug('pixel-den-koramangala');
  const tier = tierOf(cafe, 'Standard PC');
  const sunday: LocalDate = '2026-11-22';
  const saturday: LocalDate = '2026-11-21';

  // ----- The player's earlier week -----
  const session = await signIn(PLAYER_PHONE);

  // Thursday 6:00 pm: holds and confirms three seats at Respawn Room for 8 pm to 10 pm.
  const respawn = bySlug('respawn-room-hsr');
  const pastHold = await booking.createHold({
    cafeId: respawn.id,
    tierId: tierOf(respawn, 'Standard PC').id,
    startsAt: ist('2026-11-19', 20),
    durationMinutes: 120,
    seatCount: 3,
  });
  const past = await booking.confirm(pastHold.id);

  // Friday 5:00 pm: holds a sim rig at Frame Rate for 9 pm, then releases it.
  setNow(ist('2026-11-20', 17));
  const frameRate = bySlug('frame-rate-indiranagar');
  const cancelledHold = await booking.createHold({
    cafeId: frameRate.id,
    tierId: tierOf(frameRate, 'Sim Rig').id,
    startsAt: ist('2026-11-20', 21),
    durationMinutes: 60,
    seatCount: 1,
  });
  const cancelled = await booking.cancel(cancelledHold.id);

  // Saturday 10:00 am: holds two seats at Clutch Arena for 4 pm and lets the ten minutes run out.
  setNow(ist(saturday, 10));
  const clutch = bySlug('clutch-arena-marathahalli');
  const lapsedHold = await booking.createHold({
    cafeId: clutch.id,
    tierId: tierOf(clutch, 'Standard PC').id,
    startsAt: ist(saturday, 16),
    durationMinutes: 60,
    seatCount: 2,
  });

  // ----- Other players fill part of Sunday evening at Pixel Den -----
  setNow(ist(saturday, 12));
  await signIn('+919999800002');
  const squadA = await booking.createHold({
    cafeId: cafe.id,
    tierId: tier.id,
    startsAt: ist(sunday, 17),
    durationMinutes: 120,
    seatCount: 10,
  });
  await booking.confirm(squadA.id);
  await signIn('+919999800003');
  const squadB = await booking.createHold({
    cafeId: cafe.id,
    tierId: tier.id,
    startsAt: ist(sunday, 21),
    durationMinutes: 120,
    seatCount: 8,
  });
  await booking.confirm(squadB.id);

  // ----- Saturday 6:02 pm: the player holds the VR bay at Overclock Lounge for tonight -----
  await signIn(PLAYER_PHONE);
  setNow(ist(saturday, 18, 2));
  const overclock = bySlug('overclock-lounge-whitefield');
  const otherHold = await booking.createHold({
    cafeId: overclock.id,
    tierId: tierOf(overclock, 'VR Bay').id,
    startsAt: ist(saturday, 21, 30),
    durationMinutes: 60,
    seatCount: 2,
  });

  // ----- Saturday 6:04 pm: Pick a time for Pixel Den's Standard PC -----
  setNow(ist(saturday, 18, 4));
  const pickNow = clock();
  const today = instantToIst(pickNow).day;
  const maxSeats = Math.max(
    BOOKING_RULES.minSeats,
    Math.min(BOOKING_RULES.maxSeats, tier.stationCount),
  );

  const snapshot = async (
    durationMinutes: Minutes,
    seatCount: number,
    chosenDay: LocalDate | null,
    startsAt: IsoInstant | null,
  ): Promise<DraftSnapshot> => {
    const draft: BookingDraft = { cafeId: cafe.id, tierId: tier.id, durationMinutes, seatCount };
    const days = dayOptions(cafe.hours, draft, pickNow);
    const day = days.some((option) => option.day === chosenDay)
      ? chosenDay
      : (days[0]?.day ?? null);
    const availability =
      day === null ? [] : await booking.getAvailability({ tierId: tier.id, day, durationMinutes });
    const slots = toSlotOptions(availability, draft, pickNow);
    return {
      durationMinutes,
      seatCount,
      maxSeats,
      days,
      day,
      slots,
      expectedSlotCount: day === null ? 0 : upcomingStarts(cafe.hours, day, draft, pickNow).length,
      selectedSlot: slots.find((slot) => slot.startsAt === startsAt && slot.selectable) ?? null,
    };
  };

  const chosenStart = ist(sunday, 19, 30);
  const pickInitial = await snapshot(60, 1, null, null);
  const pickChosen = await snapshot(120, 4, sunday, chosenStart);
  if (pickChosen.selectedSlot === null) {
    throw new Error('scenario: the story start (Sunday 7:30 pm, 4 seats, 2 h) is not selectable');
  }

  // ----- "Hold seats", then "Confirm" -----
  const held = await booking.createHold({
    cafeId: cafe.id,
    tierId: tier.id,
    startsAt: chosenStart,
    durationMinutes: 120,
    seatCount: 4,
  });
  setNow(ist(saturday, 18, 5));
  const heldNow = clock();
  const now = heldNow;
  nowMs += 20_000;
  const confirmed = await booking.confirm(held.id);

  // ----- 6:06 pm: "My bookings" -----
  setNow(ist(saturday, 18, 6));
  const bookingsNow = clock();
  const bookings = await booking.listMine();
  const byId = (id: string): Booking =>
    required(
      bookings.find((candidate) => candidate.id === id),
      `booking ${id}`,
    );
  const expired = byId(lapsedHold.id);
  if (
    expired.status !== 'expired' ||
    byId(otherHold.id).status !== 'held' ||
    bookings.length !== 5 ||
    Date.parse(required(held.holdExpiresAt, 'hold expiry')) - Date.parse(heldNow) !== 9 * MINUTE_MS
  ) {
    throw new Error('scenario: the bookings did not end in the states the board assumes');
  }

  return {
    now,
    today,
    areas,
    cafes,
    filtered: { filter, cafes: filteredCafes },
    emptyFilter,
    cafe,
    cafesBySlug,
    tier,
    pickInitial,
    pickChosen,
    session,
    typedPhone: PLAYER_PHONE.slice(3),
    typedOtp: OTP,
    held,
    heldNow,
    confirmed,
    otherHold: byId(otherHold.id),
    cancelled: byId(cancelled.id),
    expired,
    past: byId(past.id),
    bookings,
    bookingsNow,
  };
}
