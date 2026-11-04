# 02. Domain model (`@gog/domain`)

`@gog/domain` is pure TypeScript: Zod schemas, inferred types, constants and functions with no I/O, no React, no Supabase, no date library. Everything here is unit-tested with Vitest. Field names are camelCase here and snake_case in Postgres; `@gog/data` maps between them.

## Scalars

| Name         | Zod                                                             | Notes                                                                                                                                                                                                |
| ------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Uuid`       | `z.uuid()`                                                      | Zod 4 form; `z.string().uuid()` is deprecated in Zod 4 and accepts the same values                                                                                                                   |
| `Slug`       | `z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(64)` |                                                                                                                                                                                                      |
| `IsoInstant` | `z.iso.datetime({ offset: true })`                              | UTC or offset accepted; our code produces the shortest lossless UTC `Z` form (`2026-11-20T16:30:00Z`, milliseconds only when non-zero), and `@gog/data` mappers normalise PostgREST's `+00:00` to it |
| `LocalDate`  | `z.iso.date()`                                                  | A calendar day in IST; unlike a `YYYY-MM-DD` regex it rejects impossible dates such as `2026-02-30`                                                                                                  |
| `HHMM`       | `z.string().regex(/^([01]\d\|2[0-3]):[0-5]\d$/)`                | Local wall-clock time                                                                                                                                                                                |
| `Paise`      | `z.number().int().nonnegative()`                                | ADR 0009                                                                                                                                                                                             |
| `Minutes`    | `z.number().int()`                                              |                                                                                                                                                                                                      |
| `Weekday`    | `z.number().int().min(0).max(6)`                                | 0 = Sunday, as in `Date#getDay()` and Postgres `extract(dow)`                                                                                                                                        |

## Enums

```ts
StationKind = 'pc' | 'ps5' | 'xbox' | 'switch' | 'vr' | 'sim_racing' | 'other';
CafeStatus = 'draft' | 'live' | 'paused';
BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'no_show';
BookingSource = 'app' | 'counter';
```

Export both the Zod enum and a `STATION_KIND_LABELS: Record<StationKind, string>` ("PC", "PlayStation 5", "Xbox", "Nintendo Switch", "VR", "Sim racing", "Other").

Amenities stay free text (`Cafe.amenities: string[]`, `text[]` in SQL, edited in the dashboard), so their labels are a lookup, not an enum: `AMENITY_LABELS: Readonly<Record<string, string>>` holds the nine spec 08 slugs with one copy for both apps (`ac` "Air conditioning", `parking` "Parking", `food` "Food", `cafe` "Cafe", `private-room` "Private room", `streaming-setup` "Streaming setup", `tournament-ready` "Tournament ready", `wheelchair-access` "Wheelchair access", `late-night` "Open late"), and `amenityLabel(slug)` returns the known label or the dehyphenated, capitalised slug (`rooftop-seating` → "Rooftop seating").

## Entities

```ts
City          { id: Uuid; slug: Slug; name: string; state: string; isLive: boolean }
Area          { id: Uuid; citySlug: Slug; slug: Slug; name: string; lat: number; lng: number }
OpeningHours  { weekday: Weekday; opensAt: HHMM; closesAt: HHMM; isOvernight: boolean }
StationTier   { id: Uuid; cafeId: Uuid; kind: StationKind; name: string; description: string | null;
                hourlyRatePaise: Paise; stationCount: number; specs: Record<string, string>; sortOrder: number }
Game          { id: Uuid; slug: Slug; name: string; kinds: StationKind[] }
CafeImage     { id: Uuid; url: string; alt: string; sortOrder: number }
CafeRef       { id: Uuid; slug: Slug; name: string }
PlaceRef      { slug: Slug; name: string }
CafeCard      { id: Uuid; slug: Slug; name: string; city: PlaceRef; area: PlaceRef; coverImageUrl: string | null;
                kinds: StationKind[]; fromHourlyRatePaise: Paise | null; stationCount: number }
Cafe          { id: Uuid; slug: Slug; name: string; status: CafeStatus; city: PlaceRef; area: PlaceRef;
                addressLine: string; lat: number; lng: number; description: string; amenities: string[];
                whatsapp: string | null; mapsUrl: string | null; images: CafeImage[]; hours: OpeningHours[];
                tiers: StationTier[]; games: Game[] }
Promotion     { id: Uuid; slug: Slug; title: string; summary: string; body: string; imageUrl: string | null;
                cafe: CafeRef | null; citySlug: Slug | null; startsAt: IsoInstant; endsAt: IsoInstant | null;
                ctaLabel: string | null; ctaUrl: string | null; isFeatured: boolean }
Profile       { id: Uuid; displayName: string | null; phone: string | null; homeCitySlug: Slug | null }
AvailabilitySlot    { startsAt: IsoInstant; freeSeats: number }
AvailabilityRequest { tierId: Uuid; day: LocalDate; durationMinutes: Minutes; stepMinutes?: Minutes }  // step defaults to 30
BookingRequest      { cafeId: Uuid; tierId: Uuid; startsAt: IsoInstant; durationMinutes: Minutes; seatCount: number }
BookingSeat   { stationId: Uuid; stationLabel: string; releasedAt: IsoInstant | null }
Booking       { id: Uuid; cafe: CafeRef; tier: { id: Uuid; name: string; kind: StationKind }; status: BookingStatus;
                startsAt: IsoInstant; endsAt: IsoInstant; seatCount: number; hourlyRatePaise: Paise; totalPaise: Paise; lockFeePaise: Paise;
                holdExpiresAt: IsoInstant | null; source: BookingSource; seats: BookingSeat[]; createdAt: IsoInstant }
```

`Cafe.bookable` is a derived helper, not a field: `isBookable(cafe) = cafe.status === 'live' && cafe.tiers.some(t => t.stationCount > 0)`. `mapsUrlFor(cafe)` is the other derived helper: `cafe.mapsUrl` or, when null, `https://maps.google.com/?q=<lat>,<lng>`, so both apps build the map link the same way.

Counts are integers in the schemas: `seatCount`, `stationCount`, `freeSeats` and `sortOrder` are `z.number().int()` (the counts also `.nonnegative()`), so `seatCount: 2.5` fails parsing instead of slipping through the `1 ≤ seats ≤ 10` rule.

`Booking.cafe`, `Booking.tier` and `BookingSeat.stationLabel` are the names at hold time (copied into `bookings` and `booking_seats`, see `03-database.md`), not live catalog values; `Booking.hourlyRatePaise` is the rate copied at hold time (`bookings.hourly_rate_paise`), so the hold and review screens can show "₹120/hr × 2 h × 3 seats" without re-reading the tier.

`Profile.phone` is digits without `+` (`919999900001`), exactly as GoTrue stores `auth.users.phone`; the sign-in screen sends `+91…` and `+` is rendered only at the display edge.

## Booking errors

```ts
BookingErrorCode =
  'auth_required' |
  'invalid_request' |
  'outside_hours' |
  'not_enough_seats' |
  'seat_conflict' |
  'cafe_not_bookable' |
  'not_found' |
  'invalid_state' |
  'limit_reached' |
  'unknown';
class BookingError extends Error {
  code: BookingErrorCode;
  retryable: boolean; /* true only for seat_conflict */
}
```

The SQLSTATE mapping (`GG001` → `auth_required`, …) is in `03-database.md` and implemented in `@gog/data`, not here. The constructor is `new BookingError(code, message?, options?: ErrorOptions)`: a short developer-facing message per code is the default, `name` is `'BookingError'` and `retryable` is derived from the code.

## Constants

```ts
DEFAULT_CITY_SLUG = 'bengaluru';
IST_OFFSET_MINUTES = 330;
BOOKING_RULES = {
  minMinutes: 30,
  maxMinutes: 360,
  stepMinutes: 30,
  minSeats: 1,
  maxSeats: 10,
  minLeadMinutes: 5,
  maxLeadDays: 30,
  holdMinutes: 10,
  maxLiveHolds: 3,
  maxUpcomingBookings: 10,
};
```

The same numbers are enforced in `create_booking` in SQL. A pgTAP test and a Vitest test both pin them, so changing one without the other fails CI. `maxLiveHolds` and `maxUpcomingBookings` are the per-account caps (`GG009`, `limit_reached`): one signed-in account may have at most three live holds (`held` with a future `holdExpiresAt`) and at most ten upcoming bookings (confirmed, or live held, with `startsAt` in the future) at once, so no single phone number can hoard a cafe's seats. The numbers are a founder call and bound hoarding only; the Seat Lock fee (spec 01, deferred) remains the real deterrent.

## Pure functions

Time (India only, ADR 0009):

- `istToInstant(day: LocalDate, minutesFromMidnight: number): IsoInstant` — minutes may exceed 1440 (next day).
- `instantToIst(instant: IsoInstant): { day: LocalDate; minutesFromMidnight: number; weekday: Weekday }`
- `parseHHMM(value: HHMM): number` and `formatHHMM(minutes: number): HHMM`
- `addMinutes(instant, minutes): IsoInstant`
- `minutesBetween(a: IsoInstant, b: IsoInstant): Minutes` — whole minutes elapsed, truncated towards zero; `instantToIst(...).minutesFromMidnight` likewise drops seconds.
- `weekdayOf(day: LocalDate): Weekday` and `addDays(day: LocalDate, n: number): LocalDate` — no date library: `Date.UTC`.
- `formatIstTime(instant, { style: 'short' }): string` — "7:30 pm" (the options argument is optional and `short` is the only style); `formatIstDate(instant): string` — "Sat, 21 Nov".
- `formatWeekday(weekday): string` — "Sat"; `formatWallClockTime(minutesFromMidnight): string` — "7:30 pm". Shared by `formatIstTime` and `groupHoursForDisplay`, and exported for the app's day picker.

Opening hours (`openingWindowFor`, `slotStarts` and `AvailabilityRequest.day` take the opening day: slots after midnight belong to the day the cafe opened, so a Saturday 00:30 IST session inside a Friday 22:00–02:00 window is requested with the Friday date, matching `cafe_open_window(p_day)` in SQL):

- `openingWindowFor(hours: OpeningHours[], day: LocalDate): { opensAt: IsoInstant; closesAt: IsoInstant } | null` — null when closed that weekday; overnight closes on the next day.
- `isOpenDuring(hours, startsAt, endsAt): boolean` — true if the range sits inside the window of `day(startsAt)` or inside the overnight window of the previous day; false for an empty or reversed range (SQL's empty-range `<@` would be true, but `create_booking` validates the duration first, so the case never reaches it).
- `slotStarts(hours, day, { durationMinutes, stepMinutes = 30 }): IsoInstant[]` — every start from opening, stepping, such that `start + duration <= closesAt`; `[]` when closed, when the duration exceeds the window, or for a non-positive duration or step (loop guard).
- `groupHoursForDisplay(hours): Array<{ days: string; hours: string }>` — consecutive weekdays with identical hours grouped, running Sunday → Saturday (the `Weekday` order) without wrapping Saturday into Sunday. With the sample hours this gives `{ days: 'Sun – Thu', hours: '10:00 am – 11:00 pm' }` and `{ days: 'Fri – Sat', hours: '10:00 am – 2:00 am (next day)' }`; a cafe closed on Sunday lists `{ days: 'Sun', hours: 'Closed' }` first and then `Mon – Thu`. A single day is `'Wed'`; ranges use an en dash with spaces.

Booking rules:

- `validateBookingRequest(req: unknown, now: IsoInstant): Result<BookingRequest, ValidationIssue[]>` — parses with Zod, then checks: duration within rules and a multiple of step; seat count within rules; start is a multiple of 30 minutes in IST; start ≥ now + minLeadMinutes; start ≤ now + maxLeadDays. `ValidationIssue = { path: string; code: ValidationIssueCode; message: string }` with `ValidationIssueCode = 'invalid_shape' | 'duration_out_of_range' | 'duration_not_multiple_of_step' | 'seat_count_out_of_range' | 'start_not_aligned' | 'start_too_soon' | 'start_too_far'`; a shape failure is returned alone, otherwise every failed rule is reported at once, so the apps map issues to copy by `code`, never by message.
- `quote({ hourlyRatePaise, durationMinutes, seatCount }): { perSeatPaise: Paise; totalPaise: Paise }` — `perSeat = Math.round(rate × minutes / 60)`, `total = perSeat × seats`. `Math.round` rounds halves up, which equals SQL `round(numeric)` (ties away from zero) for non-negative values; the test pins odd-paise rates: 8025 paise, 30 min, 1 seat → 4013; 8025, 90 min, 3 seats → 36114 (12037.5 → 12038 × 3).
- `holdExpiresAt(now: IsoInstant, minutes = BOOKING_RULES.holdMinutes): IsoInstant`
- `canTransition(from: BookingStatus, to: BookingStatus): boolean` — held → confirmed | cancelled | expired; confirmed → cancelled | completed | no_show; everything else false.

Money and text:

- `formatPaise(paise: Paise, opts?: { alwaysShowPaise?: boolean }): string` — `₹120`, `₹62.50`, `₹1,250` with `en-IN` grouping: the rupee integer goes through `Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })` and the paise are appended exactly (no floating-point division).
- `formatHourlyRate(paise: Paise): string` — `₹120/hr`, the per-hour form both apps show for a tier.
- `formatCount(count: number, noun: string, plural?: string): string` — `1 seat`, `12 stations`, `6 cafes`; the plural defaults to `noun + 's'`.
- `slugify(input: string): Slug` — NFKD with combining marks removed, apostrophes dropped (`Rohan's` → `rohans`), everything else non-alphanumeric collapsed to single dashes, cut to 64 characters without a trailing dash. It never throws (an input with no letters yields `''`), so untrusted input is validated with the `Slug` schema afterwards.
- `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }` with `ok()` and `err()` helpers.

## Invariants (tested)

1. A booking's `endsAt` is `startsAt + durationMinutes` and is inside opening hours.
2. `booking.totalPaise === quote({ hourlyRatePaise: booking.hourlyRatePaise, durationMinutes: minutesBetween(booking.startsAt, booking.endsAt), seatCount: booking.seatCount }).totalPaise` (the rate is copied at hold time, not referenced, so later price changes do not alter past bookings, and the invariant is checkable from a `Booking` alone).
3. Status transitions follow `canTransition`.
4. Slot starts never produce a session that ends after closing.
5. Overnight hours: a Friday `22:00`–`02:00` window contains Saturday `00:30`–`01:30` IST.
