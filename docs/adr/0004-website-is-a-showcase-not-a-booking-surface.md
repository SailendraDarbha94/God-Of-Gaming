# 0004. The website is a showcase, not a booking surface

Date: 2026-11-04
Status: Accepted

## Context

The research report suggested using the website as the booking front door. On 4 November 2026 the founder decided otherwise: the website showcases cafes and promotions and drives app downloads; all booking happens in the apps.

## Decision

- `apps/web` has no sign-in, no booking flow, no forms that store data. It renders cities, areas, cafes, station tiers with prices, games, opening hours and promotions, plus static pages (how it works, for cafes, download, legal).
- It reads through the anon Supabase key only, via the catalog read API of `@gog/data`. Importing booking, profile or availability modules into the web app is an ESLint error.
- Pages are statically generated and revalidated (ISR) so the site stays fast and cheap, and survives a Supabase outage with stale content.
- Every cafe page carries a "Book in the app" call to action that is a Universal Link / App Link into the player app, with store badges as the fallback. The site hosts `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`.
- SEO is the website's job: one URL per cafe and per area, structured data (`schema.org` LocalBusiness), sitemap, canonical URLs, Open Graph images.

## Consequences

- The web app is simple to secure: no user data, no cookies, no consent banner.
- Discovery traffic from search lands on cafe pages and is handed to the app. Download conversion, not bookings, is the website's metric.
- If the founder later wants booking on the web, that is a new ADR and a new app or route group with auth; the data layer already supports it.
