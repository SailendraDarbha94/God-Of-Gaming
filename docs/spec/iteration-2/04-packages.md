# 04. Packages and tooling

## Workspace

```
apps/
  web/              @gog/web       unchanged layout; copy changes and one static page, M7's deletion page (01-scope.md)
  player/           @gog/player    unchanged layout; changes listed in 01-scope.md
  partner/          @gog/partner   new: Next.js 16 partner dashboard (05-partner-app.md)
packages/
  domain/           @gog/domain    new partner entities, inputs, rules, constants, PartnerError
  data/             @gog/data      new ./partner subpath, browser session client, fixture world
  eslint-config/    @gog/eslint-config  new ./partner config; web and expo boundaries extended
  tsconfig/         @gog/tsconfig  unchanged
```

`apps/*` already picks up the new app (`pnpm-workspace.yaml`). Dependencies used by two packages are pinned once in the catalog (ADR 0002), so these move there from `apps/web/package.json`, at the versions it pins today: `next` 16.4.5, `tailwindcss` 4.3.4, `@tailwindcss/postcss` 4.3.4, `postcss` 8.5.32. `eslint-config-next` stays pinned in `packages/eslint-config/package.json` and moves with `next`. Next 16.4.6 (9 Nov 2026) is a backport of bug fixes, not a security release ([release notes](https://github.com/vercel/next.js/releases/tag/v16.4.6), read 16 Nov 2026); a bump is its own pull request. `@tanstack/react-query` is already in the catalog. `apps/partner` adds one dependency nobody else uses, `@playwright/test` at an exact version (1.65.1 was current on 16 Nov 2026), for its smoke test. `@supabase/ssr` is not added (ADR 0013).

## `@gog/domain`

Pure as before (Zod only; the `library` lint boundary still applies). Every function below has Vitest tests, and every constant is pinned by a test that names the SQL rule it mirrors (`03-database.md`, Rules shared with `@gog/domain`).

### Files

```
src/
  enums.ts            changed: CafeMemberRole, PartnerRole, BlockKind, BLOCK_KIND_LABELS
  phone.ts            new: moved from apps/player (INDIA_DIAL_CODE, normaliseIndianMobileInput, toIndianMobileE164),
                      plus phoneDigits, formatPhoneDigits, containsPhoneNumber
  booking.ts          changed: hasLapsed and effectiveStatus moved from apps/player; validateBookingRequest options;
                      effectiveLeadMinutes; bookingCode
  entities.ts         changed: Cafe, StationTier, Booking fields; isBookable
  partner.ts          new: Station, PartnerTier, CafeClosure, TermsAcceptance, PartnerArea, PartnerCafe,
                      PartnerCafeSummary, CafeMember, CafeInvite, PartnerBookingSeat, PartnerBooking
  partner-inputs.ts   new: input schemas and their validators, FieldIssue
  listing-rules.ts    new: publishChecklist, appBookingsChecklist, approvalChecklist, previewCafe
  counter.ts          new: counterActions, boardRange
  partner-errors.ts   new: PartnerErrorCode, PartnerError
  constants.ts        changed: LISTING_RULES, CAFE_BOOKING_RULES, COUNTER_RULES, INVITE_RULES, OPERATOR_RULES,
                      PARTNER_TERMS_VERSION
```

### Enums

```ts
CafeMemberRole = 'owner' | 'staff'; // mirrors cafe_member_role
PartnerRole = 'owner' | 'staff' | 'operator'; // what cafe_role() returns
BlockKind = 'walk_in' | 'phone' | 'other_app' | 'maintenance' | 'event' | 'other';
BLOCK_KIND_LABELS = {
  walk_in: 'Walk-in',
  phone: 'Phone or WhatsApp',
  other_app: 'Another app',
  maintenance: 'Maintenance',
  event: 'Private event',
  other: 'Other',
};
```

### Changed public entities (M2, M5)

- `Cafe` gains `appBookingsEnabled: boolean`, `appNoticeMinutes: number` and `noShowGraceMinutes: number` (all `int`, the last two within `CAFE_BOOKING_RULES`).
- `StationTier` gains `bookableStationCount: number` (active and pledged; `stationCount` keeps meaning active).
- `isBookable(cafe)` becomes `cafe.status === 'live' && cafe.appBookingsEnabled && cafe.tiers.some(t => t.bookableStationCount > 0)`.
- `Booking` gains `cafeCancelReason: string | null` (M5): set only for a booking the cafe cancelled, and only in rows read from `my_booking_details`; the three RPC results map it to `null`.
- Invariant 2 of spec 02 (`totalPaise` equals the quote) is restated for `source = 'app'`; counter rows carry zero amounts and never reach a `Booking` anyway.

### Partner entities (M1, M3)

```ts
Station            { id: Uuid; tierId: Uuid; label: string; isActive: boolean; isAppBookable: boolean }
PartnerTier        { id: Uuid; kind: StationKind; name: string; description: string | null; hourlyRatePaise: Paise;
                     specs: Record<string, string>; sortOrder: number; stations: Station[] }
CafeClosure        { id: Uuid; startsAt: IsoInstant; endsAt: IsoInstant; note: string | null }
TermsAcceptance    { version: string; acceptedAt: IsoInstant }
PartnerArea        { id: Uuid; slug: Slug; name: string; citySlug: Slug; cityName: string; cityIsLive: boolean }
PartnerCafe        { id: Uuid; slug: Slug; name: string; status: CafeStatus; firstPublishedAt: IsoInstant | null;
                     role: PartnerRole; area: PartnerArea; addressLine: string; lat: number; lng: number;
                     description: string; amenities: string[]; whatsapp: string | null; mapsUrl: string | null;
                     appBookingsEnabled: boolean; appBookingsApprovedAt: IsoInstant | null;
                     suspendedAt: IsoInstant | null; counterTestedAt: IsoInstant | null;
                     appNoticeMinutes: number; noShowGraceMinutes: number;
                     images: CafeImage[]; hours: OpeningHours[]; tiers: PartnerTier[]; gameIds: Uuid[];
                     closures: CafeClosure[]; terms: TermsAcceptance | null }
PartnerCafeSummary { id: Uuid; slug: Slug; name: string; status: CafeStatus; areaName: string; role: PartnerRole;
                     appBookingsEnabled: boolean; unacknowledgedCount: number }
CafeMember         { userId: Uuid; role: CafeMemberRole; displayName: string | null; phoneLast4: string;
                     joinedAt: IsoInstant; isSelf: boolean }
CafeInvite         { id: Uuid; phone: string; role: CafeMemberRole; invitedAt: IsoInstant; expiresAt: IsoInstant }
PartnerBookingSeat { stationId: Uuid; stationLabel: string; startsAt: IsoInstant; endsAt: IsoInstant;
                     releasedAt: IsoInstant | null }
PartnerBooking     { id: Uuid; code: string; cafe: { id: Uuid; name: string };
                     tier: { id: Uuid; name: string; kind: StationKind }; source: BookingSource;
                     blockKind: BlockKind | null; note: string | null; status: BookingStatus;
                     startsAt: IsoInstant; endsAt: IsoInstant; seatCount: number; hourlyRatePaise: Paise;
                     totalPaise: Paise; holdExpiresAt: IsoInstant | null; createdAt: IsoInstant;
                     acknowledgedAt: IsoInstant | null; checkedInAt: IsoInstant | null; closedAt: IsoInstant | null;
                     cancelReason: string | null; noShowGraceMinutes: number | null /* the booking's copy */;
                     seats: PartnerBookingSeat[] }
```

`CafeInvite.phone` is digits without `+`, like every stored phone; `formatPhoneDigits` renders `+91 98765 43210` at the display edge. `PartnerBooking.code` is `bookingCode(id)`. There is no player identity anywhere in these shapes (ADR 0017).

### Inputs and validators (M2, M4)

```ts
NewCafeInput         { slug: Slug; name: string; areaId: Uuid; addressLine: string; lat: number; lng: number }
CafeDetailsInput     { name: string; areaId: Uuid; addressLine: string; lat: number; lng: number; description: string;
                       amenities: string[]; whatsapp: string | null; mapsUrl: string | null }
TierInput            { id: Uuid | null; kind: StationKind; name: string; description: string | null;
                       hourlyRatePaise: Paise; specs: Record<string, string>; sortOrder: number }
StationInput         { label: string; isAppBookable: boolean }
InviteInput          { cafeId: Uuid; phone: string /* E.164, +91… */; role: CafeMemberRole }
ClosureInput         { cafeId: Uuid; startsAt: IsoInstant; endsAt: IsoInstant; note: string | null }
AppBookingRulesInput { noticeMinutes: number; noShowGraceMinutes: number }
CounterBlockInput    { cafeId: Uuid; tierId: Uuid; stationIds: Uuid[] | null; seatCount: number | null;
                       startsAt: IsoInstant | null /* null = now */; durationMinutes: Minutes; kind: BlockKind;
                       note: string | null }
```

Each has a validator `validateX(input: unknown, …): Result<X, FieldIssue[]>` that parses with Zod and then applies the SQL rules, in the style of `validateBookingRequest`: a shape failure comes back alone, otherwise every failed rule is reported at once. `FieldIssue = { path: string; code: FieldIssueCode; message: string }` with `FieldIssueCode = 'invalid_shape' | 'missing' | 'too_short' | 'too_long' | 'out_of_range' | 'invalid_format' | 'duplicate' | 'not_on_grid' | 'contains_phone_number' | 'in_the_past' | 'too_far_ahead'`. The time-dependent ones (`validateClosure`, `validateCounterBlock`) take `now: IsoInstant`. `validateCafeDetails` accepts a map link only when it starts with one of `LISTING_RULES.mapsUrlPrefixes`, as `update_cafe_details` does. `validateHours(hours: unknown): Result<OpeningHours[], FieldIssue[]>` applies the half-hour grid, one row per weekday and the close-after-open rule of `cafe_hours`; it is the domain's first statement of that check, which iteration 1 left to SQL. The apps validate before calling, so `GG011` is a backstop the user should rarely see.

### Rules

- `phoneDigits(e164)`, `formatPhoneDigits(digits)` and `containsPhoneNumber(text)`, the last mirroring SQL `has_phone_number` with the same test strings as pgTAP 007.
- `hasLapsed(booking, now)` and `effectiveStatus(booking, now)`, moved unchanged from `apps/player/src/features/booking/history.ts`, which keeps `isCancellable` and `splitBookings` and imports these. `isCancellable` compares `startsAt` from M1, as `cancel_booking` refuses a booking from its start.
- `validateBookingRequest(req, now, options?: { minLeadMinutes?: number })`: the existing function, with the lead time overridable so the player can pass the cafe's notice. `effectiveLeadMinutes(cafe: Pick<Cafe, 'appNoticeMinutes'>) = Math.max(BOOKING_RULES.minLeadMinutes, cafe.appNoticeMinutes)`.
- `bookingCode(id: Uuid): string`: the last six hexadecimal characters of the id, upper case (`…-0000009000a1` gives `9000A1`). The last six, not the first, because fixture ids share a prefix. Not unique across all bookings; unique enough within one cafe's week, and the board shows every match.
- `publishChecklist(cafe: PartnerCafe): PublishRequirement[]` returns the missing items, by the names `GG014` uses: `'owner_terms' | 'hours' | 'stations' | 'live_city' | 'not_suspended'`. `appBookingsChecklist(cafe)` returns `'listed' | 'pledged_station' | 'not_suspended' | 'approved'` items the same way, `approved` only when `cafe.role` is `owner`. `approvalChecklist(cafe)` returns `'counter_test'` while `counterTestedAt` is null, for the operator's Approve button.
- `previewCafe(cafe: PartnerCafe, games: Game[]): Cafe`: the public shape the website and the player app would build for this cafe once listed, with `stationCount` counting active stations and `bookableStationCount` active pledged ones, games resolved from `gameIds` (unknown ids dropped), status as it is. The preview screen renders it.
- `counterActions(booking: PartnerBooking, now: IsoInstant, cafe: Pick<PartnerCafe, 'noShowGraceMinutes'>): CounterAction[]` returns the actions the SQL rules allow at `now`, from `'acknowledge' | 'check_in' | 'no_show' | 'complete' | 'cancel' | 'extend' | 'move' | 'add_time'` (`add_time` on an app booking means a counter block that starts at its end). The no-show boundary uses `booking.noShowGraceMinutes ?? cafe.noShowGraceMinutes`, as `mark_no_show` does. Tests pin each boundary against `COUNTER_RULES` and the grace period, including a booking whose grace differs from the cafe's current one.
- `boardRange(hours: OpeningHours[], now: IsoInstant): { from: IsoInstant; to: IsoInstant }`: from the opening of the opening day that contains `now` (the previous day's when an overnight window is still open; IST midnight when the cafe is closed today) to eight days later, the most `partner_bookings` accepts.

### Constants

```ts
LISTING_RULES = {
  cafeNameMin: 2,
  cafeNameMax: 80,
  addressMin: 3,
  addressMax: 200,
  descriptionMax: 1200,
  amenitiesMax: 12,
  mapsUrlMax: 500,
  mapsUrlPrefixes: [
    'https://maps.app.goo.gl/',
    'https://goo.gl/maps/',
    'https://maps.google.com/',
    'https://www.google.com/maps',
    'https://google.com/maps',
  ],
  latMin: 6,
  latMax: 37.5,
  lngMin: 68,
  lngMax: 97.5,
  tierNameMin: 2,
  tierNameMax: 40,
  tierDescriptionMax: 300,
  tierSortOrderMax: 99,
  hourlyRateMinPaise: 1000,
  hourlyRateMaxPaise: 500000,
  specsMaxKeys: 12,
  specValueMax: 60,
  stationLabelMax: 16,
  stationsPerCall: 50,
  gamesMax: 60,
  imagesMax: 12,
  imageAltMax: 140,
};
CAFE_BOOKING_RULES = {
  noticeMinMinutes: 30,
  noticeMaxMinutes: 1440,
  noticeStepMinutes: 30,
  noticeDefaultMinutes: 180,
  graceMinMinutes: 5,
  graceMaxMinutes: 60,
  graceDefaultMinutes: 15,
};
COUNTER_RULES = {
  blockMinMinutes: 15,
  blockMaxMinutes: 720,
  blockStepMinutes: 15,
  blockMaxSeats: 50,
  blockMaxLeadDays: 30,
  blockBackdateMinutes: 5,
  extendMinMinutes: 15,
  extendMaxMinutes: 240,
  extendAfterEndMinutes: 30,
  checkInEarlyMinutes: 30,
  resolveWithinHours: 24,
  noteMax: 200,
  reasonMin: 3,
  reasonMax: 200,
  closureNoteMax: 120,
  closureMaxDays: 14,
  boardMaxDays: 8,
  acknowledgeMaxIds: 100,
  phoneDigitRun: 7,
};
INVITE_RULES = { expiryDays: 14 };
OPERATOR_RULES = {
  bookerPhoneWindowHours: 24,
  unacknowledgedDefaultMinutes: 10,
  cafeCancellationsDefaultHours: 24,
};
PARTNER_TERMS_VERSION = '2026-11-17-draft'; // matches the terms_version check; changes when counsel's text lands
```

### `PartnerError`

```ts
PartnerErrorCode =
  'auth_required' |
  'not_found' |
  'forbidden' |
  'invalid_input' |
  'conflict' |
  'last_owner' |
  'not_ready' |
  'invalid_state' |
  'not_enough_seats' |
  'seat_conflict' |
  'unknown';
class PartnerError extends Error {
  code: PartnerErrorCode;
  retryable: boolean; /* seat_conflict only */
}
```

Built like `BookingError`: `new PartnerError(code, message?, options?)`, a developer-facing default message per code, `name = 'PartnerError'`. User copy lives in the apps, keyed by code.

## `@gog/data`

### Clients (M1)

- `createBrowserSessionClient({ url, key, storageKey, clock? }): DataClient` in `client.ts`: `assertPublishableKey(key)` first; `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey, storage: globalThis.localStorage }`; requests through `clock.fetch` when a `ServerClock` is given, as `createNativeClient` does. It throws a clear `Error` when `localStorage` is missing, so a call during server rendering fails loudly. The partner app passes `storageKey: 'gog-partner-auth'`.
- `createNativeClient` gains an optional `storageKey`, and the player passes `'gog-player-auth'`, so moving the API to `api.<domain>` signs nobody out (supabase-js 2.118.0 otherwise derives the key from the first label of the API host). This signs development devices out once.
- `PublishableKeyError`'s message names `apps/web`, `apps/player` and `apps/partner`.
- Whether the browser can read the `Date` header of Supabase's cross-origin responses (it needs `Access-Control-Expose-Headers`) is not verified. If it cannot, `ServerClock` silently keeps the device clock, which affects only what the board displays; every time rule is decided by the database. M3 checks it on the local stack and records the result in `docs/spec/09-partner-app.md`.

### Fixture world (M1, extended per milestone)

`fixtures/world.ts` exports `createFixtureWorld({ now, session?, sampleBookings? }): FixtureWorld` and `sharedFixtureWorld()`, which creates one world on first use with `sharedFixtureSession` and `sampleBookings: true`. A world is the mutable state every fixture repository shares: the seven cafes as partner records, stations with their flags, memberships, invites, operator numbers (`919999900009`), closures, terms acceptances, and the bookings and seats that `FixtureBookingRepository` used to keep on its own. Its operations apply the SQL rules in the same order as the functions and throw `PartnerError` or `BookingError` with the same codes, so the contract suites can hold both implementations to one behaviour: among them, an expired invite is revoked when its number is invited again, only an operator removes or demotes another owner, an owner switches app bookings on only after an operator's approval, approval needs a completed, checked-in app booking, a suspended cafe cannot be listed, and `listBookings` adds unacknowledged bookings beyond the range. It keeps no audit log. Fixture sessions are always code sign-ins, so the world has no counterpart of `is_otp_session`; pgTAP and the Supabase contract run cover that rule.

`DataSourceOptions`' fixtures branch becomes `{ source: 'fixtures'; now?: Clock; world?: FixtureWorld }`. `createBookingRepository`, `createAuthGateway` and `createPartnerRepositories` use the given world, or `sharedFixtureWorld()`; the auth gateway takes the world's session. `FixtureBookingRepository` reads cafes, stations, closures and settings from the world and applies the M2 rules (switch, notice, closures, pledges). The fixture catalog keeps reading the static dataset (`bengaluru.ts`, which gains the new fields): edits made through a fixture world show in `PartnerRepository.getCafe`, not in `CatalogRepository`, which only the website and the player read.

In the browser a module-level world is per tab, so each person testing the partner app on fixtures has their own (ADR 0013). `sampleBookings` adds the board content of `08-sample-data.md`, relative to `now`; contract suites pass `false`.

### `./partner` (new subpath)

```
src/partner/
  index.ts                barrel for the "./partner" export; also re-exports DataError and type DataErrorCode
                          from ../errors, because the partner app may not import the @gog/data root
  repositories.ts         the four interfaces and PartnerRepositories
  create.ts               createPartnerRepositories(options: DataSourceOptions): PartnerRepositories
  supabase-partner.ts     SupabasePartnerRepository     (rpc: is_platform_operator, accept_cafe_invites, partner_cafes, partner_cafe)
  supabase-listing.ts     SupabaseListingRepository     (rpc: the Listing, Publishing and settings functions)
  supabase-membership.ts  SupabaseMembershipRepository  (rpc: the Membership functions)
  supabase-counter.ts     SupabaseCounterRepository     (rpc: partner_bookings and the Counter and operator functions)
  supabase-images.ts      M6: Storage upload under <cafeId>/<random>.<ext>, then add_cafe_image with the public URL
  fixture-partner.ts  fixture-listing.ts  fixture-membership.ts  fixture-counter.ts    over a FixtureWorld
  mappers.ts              toPartnerCafe, toPartnerCafeSummary, toPartnerBooking, toCafeMember, toCafeInvite
  mappers.test.ts         recorded row and jsonb shapes → expected domain objects
  errors.ts               mapPartnerError(error): PartnerError
  errors.test.ts
```

```ts
interface PartnerRepository {
  isOperator(): Promise<boolean>;
  acceptInvites(): Promise<Array<{ cafeId: Uuid; role: CafeMemberRole }>>;
  listMyCafes(): Promise<PartnerCafeSummary[]>;
  getCafe(cafeId: Uuid): Promise<PartnerCafe>; // PartnerError not_found for a stranger or an unknown id
}

interface ListingRepository {
  createCafe(input: NewCafeInput): Promise<Uuid>; // operator
  setSlug(cafeId: Uuid, slug: Slug): Promise<void>; // operator, before the first publish
  updateDetails(cafeId: Uuid, input: CafeDetailsInput): Promise<void>;
  saveTier(cafeId: Uuid, input: TierInput): Promise<Uuid>;
  deleteTier(tierId: Uuid): Promise<void>;
  addStations(tierId: Uuid, labels: string[]): Promise<Uuid[]>;
  updateStation(stationId: Uuid, input: StationInput): Promise<void>;
  setStationActive(stationId: Uuid, isActive: boolean): Promise<void>; // M4
  deleteStation(stationId: Uuid): Promise<void>;
  setHours(cafeId: Uuid, hours: OpeningHours[]): Promise<void>;
  setGames(cafeId: Uuid, gameIds: Uuid[]): Promise<void>;
  acceptTerms(cafeId: Uuid, version: string): Promise<void>;
  setStatus(cafeId: Uuid, status: CafeStatus): Promise<void>;
  setAppBookings(cafeId: Uuid, enabled: boolean): Promise<void>; // M4
  approveAppBookings(cafeId: Uuid, approved: boolean): Promise<void>; // M4, operator
  suspendCafe(cafeId: Uuid, suspended: boolean): Promise<void>; // M4, operator
  setAppBookingRules(cafeId: Uuid, rules: AppBookingRulesInput): Promise<void>; // M4
  addClosure(input: ClosureInput): Promise<Uuid>; // M4
  removeClosure(closureId: Uuid): Promise<void>; // M4
  addImage(cafeId: Uuid, file: Blob, alt: string): Promise<Uuid>; // M6
  removeImage(imageId: Uuid): Promise<void>; // M6
  reorderImages(cafeId: Uuid, imageIds: Uuid[]): Promise<void>; // M6
}

interface MembershipRepository {
  listMembers(cafeId: Uuid): Promise<CafeMember[]>;
  listInvites(cafeId: Uuid): Promise<CafeInvite[]>;
  invite(input: InviteInput): Promise<Uuid>;
  revokeInvite(inviteId: Uuid): Promise<void>;
  removeMember(cafeId: Uuid, userId: Uuid): Promise<void>;
  setMemberRole(cafeId: Uuid, userId: Uuid, role: CafeMemberRole): Promise<void>;
}

interface CounterRepository {
  listBookings(
    cafeId: Uuid,
    range: { from: IsoInstant; to: IsoInstant },
  ): Promise<PartnerBooking[]>; // M3; plus every unacknowledged confirmed app booking that has not ended
  acknowledge(cafeId: Uuid, bookingIds: Uuid[]): Promise<number>; // M3
  createBlock(input: CounterBlockInput): Promise<PartnerBooking>; // M4
  extendBlock(bookingId: Uuid, minutes: number): Promise<PartnerBooking>; // M4
  complete(bookingId: Uuid): Promise<PartnerBooking>; // M4
  cancelAsCafe(bookingId: Uuid, reason: string | null): Promise<PartnerBooking>; // M4
  checkIn(bookingId: Uuid): Promise<PartnerBooking>; // M5
  markNoShow(bookingId: Uuid): Promise<PartnerBooking>; // M5
  moveSeat(bookingId: Uuid, fromStationId: Uuid, toStationId: Uuid): Promise<PartnerBooking>; // M5
  listUnacknowledged(olderThanMinutes: number): Promise<PartnerBooking[]>; // M3, operator
  listCafeCancellations(sinceHours: number): Promise<PartnerBooking[]>; // M4, operator
  bookerPhone(bookingId: Uuid): Promise<string>; // M3, operator; digits
}

interface PartnerRepositories {
  partner: PartnerRepository;
  listing: ListingRepository;
  membership: MembershipRepository;
  counter: CounterRepository;
}
```

Repositories throw `DataError` (with `cause`) for transport failures and `PartnerError` for every answered error, as the booking repository does. The Supabase repositories leave out any argument whose value is null, so the function's `default null` applies: the generated `Args` type such parameters as optional and never as nullable (`03-database.md`, Functions). `createBlock`, `extendBlock` and `moveSeat` retry once on `seat_conflict`. Writes return ids or the changed booking, never a re-read cafe: the app invalidates its queries. `createPartnerRepositories` lives in `./partner`, not in `factory.ts`, so the website and the player keep the partner code out with a ban on one specifier.

`mapPartnerError`: `GG001`, `42501`, `PGRST301`–`303` → `auth_required`; `GG004` → `not_enough_seats`; `GG005` → `seat_conflict`; `GG007`, `PGRST116` → `not_found`; `GG008` → `invalid_state`; `GG010` → `forbidden`; `GG011` → `invalid_input`; `GG012` → `conflict`; `GG013` → `last_owner`; `GG014` → `not_ready`; anything else → `unknown`, keeping the `PostgrestError` as `cause`.

### Changes to existing modules

- `booking/supabase-booking.ts` (M0): `listMine` reads `my_booking_details`, same ordering. `booking/mappers.ts` (M5): `toBooking` accepts an optional `cafe_cancel_reason` and maps it to `cafeCancelReason`, `null` when the column is absent.
- `booking/fixture-booking.ts` (M1): `cancel` refuses a booking from its start or once it is checked in with `invalid_state`, as `cancel_booking` does; `testing/booking-contract.ts` gains that case, run on fixtures only (it needs the clock moved past the start).
- `auth/` (M7): `AuthGateway` gains `deleteAccount(): Promise<void>`, which calls `delete_my_account` and then ends the session on the device; the fixture gateway applies the same steps to its world.
- `catalog/supabase-catalog.ts` and `catalog/mappers.ts` (M2): `CAFE_SELECT` adds `app_bookings_enabled, app_notice_minutes, no_show_grace_minutes` and embeds `stations(id, is_app_bookable)`; the mapper sets `bookableStationCount`.
- `catalog/repository.ts` (M2): `CatalogRepository` gains `listGames(): Promise<Game[]>`, every row of `games` ordered with `byName` (the table is public), for the partner app's games picker. Both implementations and `describeCatalogRepository` gain it; the website does not call it.
- `fixtures/bengaluru.ts` (M1, M2): the new fields; `FixtureStation.isAppBookable`; the draft cafe and invites live in the world, not in the public dataset.
- `package.json` `exports` gains `"./partner": "./src/partner/index.ts"`. The root barrel does not re-export it; `index.test.ts` pins that, because the player imports the root.

### Contract suites

`testing/partner-contract.ts` exports `describePartnerRepositories(name, factory)`, run by `partner/fixture-partner.test.ts` and `partner/supabase-partner.test.ts`. The harness gives one persona per role, each with its own repositories over one backend:

```ts
interface PartnerPersona {
  partner: PartnerRepositories;
  booking: BookingRepository;
  phone: string;
}
interface PartnerContractHarness {
  operator: PartnerPersona;
  owner: PartnerPersona;
  staff: PartnerPersona;
  /** Signed in with no role anywhere: the stranger of the access cases and the booker of the counter cases. */
  stranger: PartnerPersona;
  now(): IsoInstant;
  /** Moves the shared clock; fixtures only. Cases that need it skip without it, as the booking suite's expiry case does. */
  advanceMinutes?: (minutes: number) => void;
  /** False on a real stack: a published cafe never returns to draft, so the case would change it for every later run. */
  canPublish: boolean;
}
```

`testing/supabase-env.ts` reads the persona numbers with defaults matching `config.toml`: `GOG_TEST_SUPABASE_OWNER_PHONE` (`+919999900002`), `…_STAFF_PHONE` (`+919999900003`), `…_STRANGER_PHONE` (`+919999900004`), `…_OPERATOR_PHONE` (`+919999900009`). The booking suite keeps `GOG_TEST_SUPABASE_PHONE` (`+919999900001`) to itself, so the partner suite's bookings never count against that player's caps. Each Supabase persona signs in with its own client and memory storage through one helper in `testing/supabase-env.ts`, then calls `acceptInvites()`. The owner persona signs in twice in one run (here and in the catalog member run), and the local stack allows one code request per number every 5 seconds (`supabase/config.toml`, `[auth.sms] max_frequency`), which GoTrue applies to test numbers too, so when GoTrue answers 429 `over_sms_send_rate_limit` the helper waits 6 seconds and retries once.

The suite works on Pixel Den's PS5 Lounge (four stations, pledged) eight days after `now()`, at 13:00, 15:00, 17:00 and 19:00 IST, and on Level Up Lounge for listing edits, so it never meets the booking suite (Pixel Den Standard PC, seven days ahead). Every case restores what it changed: edited fields go back, holds and blocks are cancelled, invites to the `+9199998000NN` numbers are revoked, and the stranger's brief membership of Level Up (M2) is removed. Some cases briefly change what the public sees of Pixel Den (the app-bookings switch, the notice period), which the catalog suite asserts, so `packages/data/vitest.config.ts` turns file parallelism off (Vitest's `fileParallelism: false`; check the option's name in Vitest 5.1) whenever `GOG_TEST_SUPABASE_URL` is set, and the Supabase suites run one after another. Cases, by milestone:

- M1: each persona's `listMyCafes` and roles (on the Supabase run this also proves that GoTrue's tokens carry the `amr` shape `is_otp_session` reads); `getCafe` for members and `not_found` for the stranger and for an unknown id; `acceptInvites` a second time returns nothing; `isOperator` for each persona.
- M2: details, tiers, stations, hours and games round-trip on Level Up and are restored; a duplicate tier name is `conflict`; staff editing a tier get `forbidden`; invite, list and revoke; the owner invites the stranger persona's number as staff of Level Up, the stranger, already signed in, joins through `acceptInvites` without signing in again, and the owner then removes them; role change and back, the demotion done by the operator persona, since an owner demoting another owner is `forbidden`; the last owner cannot leave (`last_owner`); the owner accepts the terms; when `canPublish`, publishing without terms is `not_ready` and with them succeeds; the stranger's `createHold` at Level Up is `cafe_not_bookable`.
- M3: the stranger confirms a PS5 Lounge booking; the staff persona's `listBookings` includes it with its booking code and no identity; `acknowledge` returns 1, then 0; the operator's `listUnacknowledged(0)` includes it until it is acknowledged; `bookerPhone` returns the stranger's digits for the operator and `forbidden` for the owner; the owner's own `listMine` does not include it.
- M4: a staff walk-in block on PS5-02 lowers `getAvailability` for that slot by one; `extendBlock` takes the next slot; `complete` frees it; `cancelAsCafe` on a block needs no reason; `cancelAsCafe` on the stranger's booking with a reason puts it in the operator's `listCafeCancellations(24)`, and the owner gets `forbidden` there; with the switch off, `createHold` fails with `cafe_not_bookable`, and the switch goes back on; a notice of 1,440 minutes turns a start within the next day to 0 free seats and is undone; a closure on day nine shows in availability and is removed. On fixtures only (with `canPublish`, because restoring needs a cafe approved from scratch): an owner switching app bookings on before approval is `not_ready`, approval needs a completed, checked-in app booking, and a suspended cafe cannot be listed again until the suspension is lifted.
- M5: on fixtures (with `advanceMinutes`), check-in inside and outside its window, no-show before and after grace, and the sweeper's effect; on both, `moveSeat` on a future booking; a cafe cancellation with a reason reaches the stranger's `listMine` as `cafeCancelReason`.

Also from M1, `catalog/supabase-catalog.test.ts` runs `describeCatalogRepository` a second time with a client signed in as the owner persona, a member of the draft Level Up Lounge, and expects exactly what the anonymous run expects; this is the test that keeps ADR 0015's first decision honest. Its harness signs the owner persona in, calls `accept_cafe_invites` through `SupabasePartnerRepository.acceptInvites`, and then asserts with `listMyCafes` that Pixel Den and the draft Level Up Lounge are listed with role owner, all before the suite runs; if they are not listed, the file fails rather than passing without a membership, whatever order Vitest runs the files in. CI's must-pass list adds `partner/supabase-partner` (`06-verification.md`).

## `@gog/eslint-config`

`partner.js`, exported as `"./partner"`: `[...presets, ...nextVitals, ...nextTs, prettier, rules, boundaries, jsNoTypeInfo]`, composed like `next.js`, with this boundary on `src/**/*.{ts,tsx}`:

```js
'no-restricted-imports': ['error', { paths: [
  { name: '@gog/data', message: 'Import @gog/data/partner, ./catalog, ./auth, ./client or ./factory (ADR 0013).' },
  { name: '@gog/data/booking', message: 'The partner app never books for players; counter writes go through @gog/data/partner (ADR 0016).' },
  { name: '@gog/data/factory', importNames: ['createBookingRepository'], message: 'The partner app does not book for players (ADR 0016).' },
  { name: '@supabase/supabase-js', message: 'Go through @gog/data (ADR 0011).' },
  { name: '@supabase/ssr', message: 'The partner app keeps its session in the browser (ADR 0013).' },
  { name: 'next/headers', message: 'The partner server renders no user data (ADR 0013).' },
] }],
'no-restricted-syntax': ['error', {
  selector: "ExpressionStatement[directive='use server']",
  message: 'No Server Actions in apps/partner (ADR 0013).',
}],
```

The `next` (website) and `expo` (player) boundaries each gain `{ name: '@gog/data/partner' }` with a message citing ADR 0013. `paths` match exact specifiers, as spec 04 explains, and the `exports` map exposes no deeper partner path. A probe file under each app proves each new rule fires, as iteration 1's probes did, and is deleted afterwards; the `'use server'` selector in particular is checked this way before it is relied on.

## `@gog/tsconfig`

No new base. `apps/partner/tsconfig.json` is exactly:

```json
{
  "extends": "@gog/tsconfig/nextjs.json",
  "compilerOptions": { "paths": { "@/*": ["./src/*"] } },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    "e2e/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

The `*.config.ts` files stay out of it: `parserOptions.projectService.allowDefaultProject` already lints them, and typescript-eslint refuses a file that is both in a project and in the default project.

## Tooling

- Root `package.json`: `"dev:partner": "turbo run dev --filter=@gog/partner"`.
- `apps/partner/package.json` scripts: `dev` (`next dev -p 3001`), `build`, `start` (`next start -p 3001`), `lint`, `typecheck` (`next typegen && tsc --noEmit`, as the website), `test` (`vitest run`), `e2e` (`playwright test`), `clean`. Port 3001 keeps `pnpm dev` from colliding with the website on 3000.
- `turbo.json`: nothing to add. `build` and `dev` already pass `NEXT_PUBLIC_*` and `VERCEL_ENV`, and the partner app reads nothing else.
- `.claude/launch.json`: a `partner` entry on port 3001 with `NEXT_PUBLIC_GOG_DATA_SOURCE=fixtures`.
- `.gitignore` and `.prettierignore`: `apps/partner/next-env.d.ts`, `apps/partner/playwright-report/`, `apps/partner/test-results/`.
