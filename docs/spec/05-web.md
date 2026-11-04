# 05. The showcase website (`apps/web`, `@gog/web`)

Next.js 16 (App Router, React Server Components, Turbopack), Tailwind CSS 4, TypeScript. Deployed to Vercel (`bom1` region) later. ADR 0004 applies: no sign-in, no booking, no forms that store anything, anon Supabase key only, catalog reads only.

## Routes

| Route                                     | Rendering                                                                                                       | Content                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                       | ISR (revalidate 300)                                                                                            | Hero with one-line pitch and store buttons; "How it works" (find → hold seats for your squad → confirm → play); featured promotions (`featuredOnly`); cafe grid for Bengaluru (first 6, "See all cafes"); areas strip; "For cafes" teaser; download CTA                                                                              |
| `/cafes`                                  | dynamic (reads `searchParams`, so a server render per request; no `revalidate` export, it would change nothing) | All live Bengaluru cafes as cards; filters by area and station kind via `searchParams` rendered as links (no client JS); empty state                                                                                                                                                                                                 |
| `/cafes/[slug]`                           | ISR with `generateStaticParams` from `listCafeSlugs`, `dynamicParams: true`, `notFound()` when null             | Gallery, name, area, address with map link, "Book in the app" card (under the address on phones, in a sticky aside from `lg` up; one instance visible per breakpoint so DOM, focus and visual order agree), description, amenities, tiers table (kind, name, specs, stations, price per hour), games chips, hours (grouped), JSON-LD |
| `/areas/[slug]`                           | ISR                                                                                                             | Area name, cafes in that area, link back to all cafes                                                                                                                                                                                                                                                                                |
| `/events`                                 | ISR                                                                                                             | Published promotions not yet ended, featured first                                                                                                                                                                                                                                                                                   |
| `/events/[slug]`                          | ISR                                                                                                             | Title, dates (IST), cafe link, body as markdown rendered server-side (a small, safe renderer such as `marked` plus sanitisation, or `react-markdown`), CTA                                                                                                                                                                           |
| `/download`                               | dynamic (reads `user-agent`)                                                                                    | Store buttons; the detected platform's button first; QR code placeholder; "Coming soon" when a store URL is not configured                                                                                                                                                                                                           |
| `/for-cafes`                              | static                                                                                                          | Pitch for owners: squad bookings, no listing fee in iteration 1 copy (no money promises beyond "talk to us"), WhatsApp and email links from `site.ts`                                                                                                                                                                                |
| `/about`, `/privacy`, `/terms`            | static                                                                                                          | Placeholders with clear "draft" labels; privacy mentions what the apps collect                                                                                                                                                                                                                                                       |
| `/sitemap.xml`, `/robots.txt`             | route files                                                                                                     | All cafe, area and event URLs                                                                                                                                                                                                                                                                                                        |
| `/.well-known/apple-app-site-association` | route handler                                                                                                   | JSON from env (`APPLE_TEAM_ID`, `IOS_BUNDLE_ID`); 404 when unset. Dot-prefixed route folders must be listed explicitly in `tsconfig.json` `include` (see Layout).                                                                                                                                                                    |
| `/.well-known/assetlinks.json`            | route handler                                                                                                   | JSON from env (`ANDROID_PACKAGE`, `ANDROID_SHA256_FINGERPRINTS`); 404 when unset. Dot-prefixed route folders must be listed explicitly in `tsconfig.json` `include` (see Layout).                                                                                                                                                    |
| `/opengraph-image` and per-cafe OG images | optional                                                                                                        | Nice to have; skip if time is short                                                                                                                                                                                                                                                                                                  |

Cafe pages link to the app with `https://<site>/cafes/<slug>` as the Universal Link (the page itself) and `gog://cafe/<slug>` as the scheme fallback. The "Book in the app" card has three forms, decided by the pure `bookCta(platform, stores)` in `store-links.ts`: on a phone whose store lists the app, a primary button that opens the app and falls back to the store; while there is no listing (and during server rendering, so a visitor without JavaScript never gets a bare `gog://` link) the store badges ("Coming soon") with an opt-in "Already have the app? Open it" link; on a desktop the badges. Event pages carry the same two-position layout for their "Next step" card.

## Data

- `src/lib/data.ts` builds one `CatalogRepository` per request via `createCatalogRepository` from `@gog/data/factory`, choosing `fixtures` or `supabase` from `env.GOG_DATA_SOURCE`. Production builds (`NODE_ENV=production` and `VERCEL_ENV=production`) refuse `fixtures` at startup.
- `src/lib/env.ts` validates env with Zod at import: `GOG_DATA_SOURCE` (`supabase | fixtures`, default `supabase`), `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required when source is `supabase`; the key is refined with `isPublishableKey` from `@gog/data/client`, so a service-role key or a user token fails at startup, ADR 0011), `NEXT_PUBLIC_SITE_URL` (required on the production deployment, NODE_ENV and VERCEL_ENV both `production`; defaults to `http://localhost:3000` everywhere else, including `next build` with fixtures on a clean clone), optional `NEXT_PUBLIC_IOS_APP_ID`, `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL`, `APPLE_TEAM_ID`, `IOS_BUNDLE_ID`, `ANDROID_PACKAGE`, `ANDROID_SHA256_FINGERPRINTS`. `parseEnv(source)` is exported and unit-tested; `vitest.config.ts` sets `GOG_DATA_SOURCE=fixtures` for the test process because the module parses `process.env` at import.
- Page components call the repository directly (server components); no client-side fetching anywhere on the site.
- Fetch failures on ISR pages are caught at the page level and rendered as a calm empty state with a `console.error`; the build must not fail because Supabase is unreachable.

## SEO and metadata

- Metadata on every route through one `pageMetadata()` helper (`generateMetadata` where it depends on data, a `metadata` constant on static pages): title template `%s · God of Gaming`, description, canonical, Open Graph, Twitter card. Metadata keywords include "Bangalore" as a synonym for Bengaluru.
- Cafe pages emit JSON-LD `LocalBusiness` (`@type: "EntertainmentBusiness"` is acceptable) with `name`, `address`, `geo`, `openingHoursSpecification` from hours, `priceRange` from the cheapest tier, `image`.
- `metadata.itunes.appId` from env for the iOS Smart App Banner.
- `next/image` with `remotePatterns` for the Supabase storage host (derived from `NEXT_PUBLIC_SUPABASE_URL`) and the placeholder image host used by fixtures.

## Design

- Dark theme by default, high contrast, one accent colour; tokens in `globals.css` under `@theme` (Tailwind 4); fonts via `next/font` (one display face, one text face, both with `display: swap`).
- Mobile first; every page works at 360 px wide with no horizontal scroll. Semantic landmarks, visible focus rings, alt text everywhere, colour contrast AA.
- Components in `src/components/` are small and server-rendered unless they need interaction; the only client components are the "Book in the app" button (platform detection) and the mobile nav toggle.
- No analytics or third-party scripts in this iteration; no cookie banner needed.

## Layout

```
apps/web/
  next.config.ts          transpilePackages: ['@gog/domain', '@gog/data'], images.remotePatterns, typedRoutes, headers()
                          (X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, X-Frame-Options DENY,
                          Permissions-Policy; a CSP follows once the storage host is known)
  postcss.config.mjs      @tailwindcss/postcss
  eslint.config.js        from @gog/eslint-config/next
  tsconfig.json           exactly the file below
  vitest.config.ts
  .env.example
  src/
    app/                  routes as above, layout.tsx, not-found.tsx, error.tsx, globals.css
    components/           Header, Footer, StoreButtons, CafeCard, CafeGrid, TierTable, HoursTable, GameChips, PromoCard, BookInAppButton, BookCta, Section, EmptyState, Markdown
    config/site.ts        name, tagline, description, WhatsApp, email, social, defaultCitySlug
    lib/                  env.ts, data.ts, seo.ts (JSON-LD builders), store-links.ts (platform detection, bookCta), format.ts (wrappers over @gog/domain formatters, bookingLimits)
    lib/*.test.ts         Vitest for env.ts, seo.ts, store-links.ts, format.ts
```

`apps/web/tsconfig.json` is exactly:

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
    "src/app/.well-known/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

TypeScript's `**` glob never descends into dot-prefixed directories, so `src/**/*.ts` alone misses `src/app/.well-known/*/route.ts`: `tsc --noEmit` would silently skip those handlers and typescript-eslint's `projectService` would abort on them with a fatal "was not found by the project service" parse error, failing `pnpm check`. Because this file uses `extends`, Next 16 bails out of its automatic tsconfig setup and never adds the `.next/types/**/*.ts` include it normally writes, so the generated route and `PageProps` types are listed here by hand.

Scripts: `dev` (`next dev`), `build`, `start`, `lint`, `typecheck` (`next typegen && tsc --noEmit`: with `typedRoutes` Next writes the route types only during `dev`, `build` or `typegen`, and CI typechecks before it builds, so a clean clone would otherwise fail on every typed `Route`, `href` or `PageProps` use), `test`. Remove `next lint` usage; Next 16 does not ship it.

## Acceptance

- `GOG_DATA_SOURCE=fixtures pnpm --filter @gog/web build` succeeds with no Supabase and renders every cafe, area and event page from the sample data.
- `pnpm --filter @gog/web dev` with fixtures shows the home page with 6 cafes and the 2 featured promotions (`/events` lists all 4).
- Lighthouse (manual, later) targets: performance ≥ 90, accessibility ≥ 95 on `/` and a cafe page.
- No import of the `@gog/data` root barrel, `@gog/data/booking`, `@gog/data/auth`, `createBookingRepository` or `createAuthGateway` from `@gog/data/factory`, or `@supabase/supabase-js` anywhere under `apps/web/src` (lint enforces).
