# 01. Product scope

## What this is

A booking aggregator for gaming cafes in India, starting in Bengaluru. Players find a cafe, see what it has (PC tiers, consoles, VR, sim rigs), its prices per hour, its games and its hours, then hold seats for themselves and their squad and confirm. Cafes get listed, promoted and, later, a counter tool. The reference product the founder named is Playo (turf and court booking); the research report in the Claude Doc linked from the root README covers the market.

## Founder decisions that bind this iteration (4 November 2026)

1. Launch city is Bengaluru, where the founder lives and will sign cafes in person. (ADR 0006)
2. The website is a showcase of cafes and promotions and a driver to download the apps. No booking, no accounts, no forms on the web. (ADR 0004)
3. Booking happens in the apps. The first app is the player app. A partner (cafe) surface comes next and its form (web dashboard or native app) is still the founder's call.
4. Good programming principles from the first commit. (ADR 0010, 0011, and `07-standards-and-verification.md`)
5. Monorepo on React Native (Expo) and Next.js. Backend is Supabase; no NestJS or FastAPI until a named trigger. (ADR 0002, 0003)

## Facts from the research that shape the code

- Players book as squads. Group size is a first-class field (`seat_count`), and allocation picks several stations of one tier for one time range.
- Cafes price by tier per hour (for example "Standard PC ₹80/hr", "Premium PC ₹120/hr", "PS5 ₹150/hr"). Prices differ across tiers inside one cafe, rarely across stations inside a tier.
- Many cafes are open late or past midnight on weekends. Opening hours need an overnight flag.
- Station kinds in the market: PC, PlayStation 5, Xbox, Nintendo Switch, VR, sim racing, plus a catch-all.
- Competitors (Playo, District, BookMyShow) list some cafes as activities but do not sell seat-level availability for squads. Seat-level, squad-aware booking is the differentiator the code must make easy.
- Promotional moments matter: GTA VI releases on 19 November 2026 with pre-loads from 10 November. Promotions (events) are a content type on the website and in the app.
- The working title "God of Gaming" was flagged in the report for a trademark check. Keep it in one config place.

## Iteration 1 delivers

1. Monorepo tooling: pnpm workspaces, Turborepo, shared TypeScript and ESLint configs, Prettier, Vitest, CI on GitHub Actions. (`04-packages.md`, `07-standards-and-verification.md`)
2. Database: migrations for the catalog, profiles and bookings; functions for availability, holds, confirm, cancel and expiry; RLS on every table; pgTAP tests; seed for Bengaluru sample data; a no-Docker local path for schema work. (`03-database.md`)
3. `@gog/domain`: schemas, types and pure rules with unit tests. (`02-domain-model.md`)
4. `@gog/data`: repository interfaces with Supabase and fixture implementations, generated database types, mappers with tests, an auth gateway. (`04-packages.md`)
5. `apps/web`: the showcase site with cafe, area and promotion pages, download page, static pages, SEO plumbing, Universal Link / App Link files. Builds with fixtures in CI. (`05-web.md`)
6. `apps/player`: an Expo development-build app with explore, cafe detail, booking flow (availability → hold → confirm), my bookings, phone OTP sign-in, deep links. Compiles, typechecks, lints, passes `expo-doctor`. (`06-player-app.md`)
7. Documentation: root README with setup, CONTRIBUTING, ADRs, this spec.

## Iteration 1 does not deliver

- Payments (Razorpay Route or Cashfree Easy Split), the Seat Lock fee, refunds.
- The partner or counter app, cafe self-onboarding, image uploads from the apps.
- Notifications (push, SMS, WhatsApp), reminders.
- Analytics, error reporting, feature flags.
- Internationalisation, cities other than Bengaluru being live, real cafe data (sample data only).
- Expo Updates, store listings, production Supabase project, custom domains.
- Admin tooling. Content is edited in the Supabase dashboard for now.

## Open decisions for the founder

- Partner surface: Next.js dashboard (`apps/partner`, fast to ship, counters have PCs) or a second Expo app (owners manage from phones). Recommendation in the root README.
- Product name and domain; Apple Developer and Google Play developer accounts; Supabase project in `ap-south-1`.
