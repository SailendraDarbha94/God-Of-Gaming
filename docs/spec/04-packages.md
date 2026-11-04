# 04. Workspace and packages

```
god-of-gaming/
  apps/
    web/              @gog/web          Next.js 16 showcase website            (05-web.md)
    player/           @gog/player       Expo SDK 58 player app                 (06-player-app.md)
  packages/
    domain/           @gog/domain       Zod schemas, types, pure rules, tests  (02-domain-model.md)
    data/             @gog/data         repositories, mappers, generated DB types, auth gateway
    tsconfig/         @gog/tsconfig     shared tsconfig bases
    eslint-config/    @gog/eslint-config shared ESLint flat configs
  supabase/           database project                                         (03-database.md)
  scripts/            repo scripts (db/local.sh)
  docs/               adr/, spec/
  .github/workflows/  ci.yml
```

Root `package.json` holds only tooling (`turbo`, `prettier`, `typescript`) and scripts. `pnpm-workspace.yaml` lists `apps/*` and `packages/*` and the catalog. `.npmrc` sets `node-linker=hoisted` (ADR 0002).

All packages are `"private": true`, `"type": "module"` (except `@gog/player`: Metro loads `metro.config.js` as CommonJS, so the app stays CommonJS and its ESLint config is `eslint.config.mjs`), have `"sideEffects": false`, and expose TypeScript source through `exports` (no build). Each has scripts `lint`, `typecheck` (`tsc --noEmit`) and, where it has tests, `test` (`vitest run`); the two config-only packages are the exception: `@gog/eslint-config` is plain JavaScript and has `lint` only (its own `eslint.config.js` applies `base`), `@gog/tsconfig` has nothing to lint or typecheck. Turborepo runs them.

## `@gog/tsconfig`

- `base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`, `moduleResolution: "bundler"`, `module: "esnext"`, `target: "es2022"`, `resolveJsonModule`, `forceConsistentCasingInFileNames`.
- `library.json`: extends base; `lib: ["es2023"]`; `types: []` (no DOM, no Node, so domain code cannot accidentally depend on either). `packages/data/tsconfig.json` extends `library.json` and sets `"lib": ["es2023", "dom"]` (the surface Node 22 and React Native share: `fetch`, `URL`, `console`, `AbortController`; Expo's own base uses the DOM lib), keeping `types: []`, because `@gog/data` logs transport failures, wraps `DataError` causes and passes `fetch` to `createClient`, none of which exist under `es2023` alone. `@gog/domain` keeps `es2023` only. (TypeScript 6.0 already defaults `types` to `[]`, so the explicit entry is documentation.)
- `nextjs.json`: extends base; `lib: ["dom", "dom.iterable", "es2023"]`, `jsx: "preserve"`, `plugins: [{ name: "next" }]`, `allowJs`, `noEmit`, `incremental`.
- `expo.json`: `extends: ["./base.json", "expo/tsconfig.base"]`: Expo's `module: preserve`, `target: esnext`, `lib: [dom, esnext]`, `jsx: react-jsx`, `moduleDetection: force` and `customConditions` win; our strictness flags still apply because Expo's base does not set them. Its own `compilerOptions` set `exactOptionalPropertyTypes: false` (own options override both extended files; domain, data and web keep it on) because Expo Router, React Navigation and expo-image declare optional props without `| undefined` (`<Stack.Screen options={{ title: maybeString }} />`, `<Image source={maybeUrl} />` would otherwise be TS2322/TS2375).

## `@gog/eslint-config`

ESLint 10 flat configs exported as arrays. Every config is composed in the same order: `presets` (ignores, `@eslint/js` recommended, `typescript-eslint` type-checked sets, `projectService`), the framework configs, `eslint-config-prettier`, then our `rules` and the package's import boundary, then `jsNoTypeInfo` last. Our rules are applied after Prettier and the framework configs on purpose: `eslint-config-next/typescript` downgrades `@typescript-eslint/no-unused-vars` to `warn`, `eslint-config-expo` sets `eqeqeq` to `['warn', 'smart']` and replaces our `no-unused-vars` options, and `eslint-config-prettier` turns `curly` off; applying ours last keeps them errors (`curly: ['error', 'all']` after Prettier is explicitly allowed by eslint-config-prettier, which only disables the option-less form).

- `base`: exports `presets` (`@eslint/js` recommended, `typescript-eslint` `recommendedTypeChecked` + `stylisticTypeChecked`, `parserOptions.projectService` with `allowDefaultProject: ['*.config.ts']`), `rules` (named `gog/rules`: `@typescript-eslint/consistent-type-imports`, `@typescript-eslint/switch-exhaustiveness-check`, `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-misused-promises`, `@typescript-eslint/no-unused-vars` with `^_` ignore patterns, `@typescript-eslint/no-non-null-assertion`, `no-console: ["warn", { allow: ["warn", "error"] }]`, `eqeqeq`, `curly`), `jsNoTypeInfo` (`tseslint.configs.disableTypeChecked` for `*.js`, `*.mjs`, `*.cjs`) and `prettier`; default export `[...presets, prettier, rules, jsNoTypeInfo]`.
- `library`: `[...presets, prettier, rules, boundaries, jsNoTypeInfo]`; the boundary is `no-restricted-imports` forbidding `react`, `react-native`, `next`, `@supabase/*` inside `@gog/domain` (the domain stays pure).
- `next`: `[...presets, ...nextVitals, ...nextTs, prettier, rules, boundaries, jsNoTypeInfo]` (`eslint-config-next` core-web-vitals and typescript); the boundary forbids, in `apps/web`, the package root `@gog/data` (it re-exports `./booking` and `./auth`), `@gog/data/booking`, `@gog/data/auth`, the names `createBookingRepository` and `createAuthGateway` from `@gog/data/factory` (`importNames`), and `@supabase/supabase-js` (ADR 0004, 0011). `no-restricted-imports` `paths` match exact specifiers, which is why the root and the factory names are listed; deep paths such as `@gog/data/booking/supabase-booking` need no entry because the package's `exports` map does not expose them. The fixture booking repository lives under `./booking`, so that entry covers it.
- `expo`: `[...presets, ...expoConfig, prettier, rules, boundaries, jsNoTypeInfo]` (`eslint-config-expo` flat config); the boundary forbids `@supabase/supabase-js` everywhere in app code, with no exempt file: `src/lib/supabase.ts` builds the client through `createNativeClient` from `@gog/data/client` and the app does not declare the SDK as a dependency.

Ignore `node_modules`, `.next`, `.expo`, `dist`, `coverage`, `*.config.*` outputs, and `packages/data/src/database.types.ts` (generated).

Export shape: `package.json` `exports` has `"./base"`, `"./library"`, `"./next"`, `"./expo"`, each file default-exporting a flat config array. A consumer's `eslint.config.js` is then three lines: `import config from '@gog/eslint-config/next'; export default config;` (plus an ignore entry if needed). `@gog/tsconfig` is referenced as `"extends": "@gog/tsconfig/nextjs.json"` and has no `exports` field so TypeScript resolves the files directly.

## `@gog/domain`

See `02-domain-model.md`. Dependencies: `zod` only. Layout:

```
src/
  index.ts            re-exports everything public
  scalars.ts  enums.ts  entities.ts  booking.ts  errors.ts  result.ts  constants.ts
  time.ts  hours.ts  money.ts  slug.ts
  *.test.ts           colocated Vitest tests
```

## `@gog/data`

Dependencies: `@gog/domain`, `@supabase/supabase-js`, `zod`. Dev: `vitest`. Its `eslint.config.js` imports `@gog/eslint-config/base` (`library` is for `@gog/domain` only: its import ban covers `@supabase/*`) and its `tsconfig.json` extends `@gog/tsconfig/library.json` with `lib: ["es2023", "dom"]` (see `@gog/tsconfig`). Layout:

```
src/
  database.types.ts            generated by `supabase gen types`; never edited by hand
  client.ts                    createPublicClient({ url, key }) for servers without a user (persistSession false);
                               createNativeClient({ url, key, storage, clock? }) for React Native (autoRefreshToken, persistSession,
                               detectSessionInUrl false; requests go through clock.fetch when a ServerClock is given); both call
                               assertPublishableKey(key) first; re-exports Database, the clock module and the key guard
  clock.ts                     Clock, systemClock, ServerClock, createServerClock — the device clock corrected by the `Date`
                               header of every response, so hold expiry and lead times follow the server, not the phone
  publishable-key.ts           isPublishableKey, assertPublishableKey, PublishableKeyError — refuses sb_secret_* keys and any
                               JWT whose role is not `anon` (service_role, user tokens) without ever quoting the key (ADR 0011)
  by-name.ts                   byName — the one `localeCompare('en')` ordering for named lists, used by the dataset and both
                               catalog implementations
  errors.ts                    DataError (codes transport | rejected | invalid_response | auth), PostgrestFailure,
                               isTransportFailure, dataErrorFromPostgrest
  parse.ts                     parseOrThrow, parseRows — Zod parse of unknown rows, invalid_response on failure
  columns.ts                   InstantColumn, TimeColumn, instantFromEpochMs — PostgREST '+00:00' instants and
                               'HH:MM:SS' times to the domain's 'Z' instants and 'HH:MM'
  catalog/
    index.ts                   barrel for the "./catalog" export
    repository.ts              interface CatalogRepository
    supabase-catalog.ts        SupabaseCatalogRepository (PostgREST queries, uses the cafe_cards view, nested selects for Cafe)
    fixture-catalog.ts         FixtureCatalogRepository (in-memory over fixtures/)
    mappers.ts                 toCity, toArea, toCafeCard, toCafe, toPromotion — each validates its output with the domain schema
    mappers.test.ts            recorded row shapes → expected domain objects
  booking/
    index.ts                   barrel for the "./booking" export
    repository.ts              interface BookingRepository
    supabase-booking.ts        rpc('get_availability'), rpc('create_booking'), rpc('confirm_booking'), rpc('cancel_booking'),
                               from('booking_details') for listMine; maps PostgrestError.code GG001..GG009 → BookingError
    fixture-booking.ts         in-memory holds: honours station counts, overlaps, expiry, the per-account caps; deterministic ids
    availability-request.ts    parseAvailabilityRequest — the shape and positivity check both implementations run first, so a
                               malformed request is `invalid_request` on fixtures and on Supabase alike
    mappers.ts                 toBooking (shared by listMine and the three RPC results), toAvailabilitySlot
    mappers.test.ts            recorded booking_details and get_availability rows → expected domain objects
    errors.ts                  mapPostgrestError(error): BookingError
    errors.test.ts
  auth/
    index.ts                   barrel for the "./auth" export
    gateway.ts                 AuthSession schema and interface AuthGateway { signInWithPhone(phone), verifyOtp(phone, token),
                               signOut(), getSession(), onAuthStateChange(cb): () => void }
    supabase-auth.ts
    fixture-auth.ts            FixtureAuthGateway (OTP FIXTURE_OTP = '123456'), userIdForPhone
  fixtures/
    index.ts                   barrel for the "./fixtures" export
    bengaluru.ts               the sample dataset (08-sample-data.md) typed with domain schemas; same UUIDs as seed.sql
    session-store.ts           the in-memory session shared by the fixture auth gateway and booking repository
    settle.ts                  resolves fixture promises on a microtask, so callers never observe synchronous completion
  factory.ts                   createCatalogRepository(options) / createBookingRepository(options) / createAuthGateway(options)
                               where options = { source: 'supabase', client } | { source: 'fixtures' }
  testing/
    index.ts                   barrel for the "./testing" export
    catalog-contract.ts        describeCatalogRepository(name, factory) — shared Vitest suite run against both implementations
    booking-contract.ts        describeBookingRepository(name, factory) — factory returns { repository, now(), advanceMinutes?, signedOut? }
    supabase-env.ts            reads GOG_TEST_SUPABASE_* so the Supabase suites run only against a real stack
  index.ts
```

Small files named after what they export (spec 07) is why `errors.ts`, `parse.ts`, `columns.ts`, `booking/mappers.ts` and `auth/fixture-auth.ts` exist beyond the first draft of this list; the `index.ts` barrels are what the `exports` map points at.

Catalog queries: `getCafe` selects `tiers:station_tiers(*, stations(id))` and the mapper sets `stationCount = stations.length` (RLS already hides inactive stations and non-live cafes). Do not use PostgREST aggregates (`stations(count)`); they are off by default on Supabase (`db-aggregates-enabled = false`), so the request errors. `listCafes` reads `cafe_cards`, whose `station_count` is computed in SQL. `cafe_cards` inner-joins `areas` and `cities`, so a live cafe in a non-live city is absent from cards, and `getCafe(slug)` returns `null` for it as well: the `areas` and `cities` policies hide the embeds a `Cafe` requires, so the query uses `areas!inner(…, cities!inner(…))` and the fixture applies the same live-city rule. Both implementations finish ordering client-side (`localeCompare('en')` on names) so a `C`-collation database cannot place `BTM Layout` before `Banashankari` and make them disagree.

Booking queries: `listMine` = `from('booking_details').select('*').order('starts_at', { ascending: false }).order('created_at', { ascending: false })` (the fixture sorts the same two keys, so a re-held slot lists the newer hold first on both). One mapper `toBooking(row)` builds `cafe: { id: cafe_id, slug: cafe_slug, name: cafe_name }`, `tier: { id: tier_id, name: tier_name, kind: tier_kind }`, `hourlyRatePaise` from `hourly_rate_paise` and `seats` from the `seats` jsonb, and is reused for the results of `create_booking`, `confirm_booking` and `cancel_booking`, which return `booking_details` rows (no second fetch after a hold, confirm or cancel). Never embed `cafes`, `station_tiers` or `stations` from `bookings`: those embeds are filtered by their own RLS policies (`status = 'live'`, `is_active and parent cafe is live`), so the first paused cafe or retired station would turn the refs into `null` and the Zod mapper would reject the row.

`mapPostgrestError`: `GG001`–`GG009` as tabled in `03-database.md` (`GG009` → `limit_reached`); `42501`, `PGRST301`, `PGRST302`, `PGRST303` → `auth_required` (an unauthenticated call to a function granted to `authenticated` only is a `42501` permission error, not `GG001`); `PGRST116` → `not_found`; anything else → `unknown`, keeping the `PostgrestError` as `cause`. `retryable` is true only for `seat_conflict`. A fetch that never got a response (postgrest-js reports `code: ''`, status 0) is a `DataError('transport')` from every method, never a `BookingError('unknown')`.

Auth: `AuthSession = { userId: Uuid; phone: string | null; expiresAt: IsoInstant | null }` (phone as digits without `+`, like `profiles.phone`); `verifyOtp(phone, token): Promise<AuthSession>`, `getSession(): Promise<AuthSession | null>`, `onAuthStateChange(listener: (session: AuthSession | null) => void): () => void`. Auth failures are `DataError` with code `auth` (`transport` when GoTrue was unreachable). The fixture gateway accepts the OTP `123456` for any phone and shares its session with the fixture booking repository, which throws `auth_required` from `createHold`, `confirm` and `cancel` when signed out and returns `[]` from `listMine` (RLS returns zero rows, not an error).

Fixtures emulate RLS: only live cities, areas of live cities, live cafes in live cities and published promotions are visible (Pune and Hyderabad are in the dataset but hidden). The fixture booking repository sweeps lapsed holds before every operation, so a lapsed hold reads as `expired` in `listMine` at once, whereas on Supabase it reads `held` until the next cron tick or the next hold on that tier; the contract suite asserts only outcomes both share. Fixture ids are deterministic: bookings `00000000-0000-4000-8000-000000900001`, `…900002` per repository instance; users `fixtureId(<last 12 digits of the phone>)`.

The Supabase contract suites (`catalog/supabase-catalog.test.ts`, `booking/supabase-booking.test.ts`) run only when `GOG_TEST_SUPABASE_URL` and `GOG_TEST_SUPABASE_ANON_KEY` point at a seeded stack (optional `GOG_TEST_SUPABASE_PHONE`, default `+919999900001`, and `GOG_TEST_SUPABASE_OTP`, default `123456`, which must match an `[auth.sms.test_otp]` entry) and otherwise skip with the reason in the suite name; CI's `database` job runs them against `supabase start`.

`exports` map: `"."`, `"./client"`, `"./catalog"`, `"./booking"`, `"./auth"`, `"./fixtures"`, `"./testing"`, `"./factory"`. The web app is allowed `./client`, `./catalog`, `./factory` (only `createCatalogRepository`; the lint rule names the two other creators), `./fixtures` and `./testing`; never `.`, because the root barrel re-exports `./booking` and `./auth`. Banning the root removes the web app's only route to `DataError` (`errors.ts` is on the root barrel alone); nothing under `apps/web/src` uses it today, and if it ever does, add an `"./errors"` entry to the `exports` map rather than re-allowing `.`.

Interfaces:

```ts
interface CatalogRepository {
  listCities(): Promise<City[]>;
  listAreas(citySlug: Slug): Promise<Area[]>;
  listCafes(filter: { citySlug: Slug; areaSlug?: Slug; kind?: StationKind }): Promise<CafeCard[]>;
  listCafeSlugs(citySlug: Slug): Promise<Slug[]>;
  getCafe(slug: Slug): Promise<Cafe | null>;
  listPromotions(filter: {
    citySlug?: Slug;
    featuredOnly?: boolean;
    at: IsoInstant;
  }): Promise<Promotion[]>; // published, not ended at `at`
  getPromotion(slug: Slug): Promise<Promotion | null>;
}

interface BookingRepository {
  getAvailability(req: AvailabilityRequest): Promise<AvailabilitySlot[]>;
  createHold(req: BookingRequest): Promise<Booking>; // throws BookingError
  confirm(bookingId: Uuid): Promise<Booking>;
  cancel(bookingId: Uuid): Promise<Booking>;
  listMine(): Promise<Booking[]>; // newest first
}
```

Repositories throw `DataError` (with `cause`) for transport failures and `BookingError` for business failures; they never return `undefined` for "not found" (use `null`) and never leak Supabase types to callers. `createHold` retries once on `seat_conflict` before rethrowing.

`GOG_DATA_SOURCE` is read by the apps, not by this package; the package only takes `options.source`.

## Versions

From the catalog: React 19.3.0 and React DOM 19.3.0 (the Expo SDK 58 template's exact versions; React Native 0.88.1 requires ^19.3.0; Next 16 accepts it), `@types/react` 19.3.0, Zod 4.x, supabase-js 2.118.x, TanStack Query 5.105.x, Vitest 5.1.x, ESLint 10.14.x (9.x is end-of-life since 2026-08-06), typescript-eslint 8.72.x, Prettier 3.9.x, Turborepo 2.11.x. TypeScript per ADR 0010. The player app's Expo-managed packages use the exact versions the `expo-template-default@sdk-58` template pins; run `npx expo install --fix` after the first install to confirm.
