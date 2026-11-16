# 0013. Partner dashboard on the web, with data access in the browser

Date: 2026-11-16
Status: Proposed

## Context

Iteration 1 left the partner surface open (spec 01, Open decisions). On 16 November 2026 the founder chose a Next.js web app, `apps/partner`, as the README recommended: cafe counters have a PC, a web app needs no store review, and it reuses `@gog/data`. An Expo partner app may follow. The founder signs cafes on in person, so the same app must work on the founder's phone during a visit and on the counter PC all day.

Three earlier records bound the choice. ADR 0004 gives the website no sign-in, so the partner surface cannot be a route group of `apps/web`. ADR 0003 defers an application server until a named trigger. ADR 0011 keeps the service-role key out of every app and makes the database the security boundary.

A signed-in Next.js app on Supabase can hold its session in two ways:

1. On the server, with `@supabase/ssr` cookies. This needs a `proxy.ts` that refreshes the session with `getClaims()` before anything else runs, auth checks inside every Server Action and Route Handler (not in layouts), the cache headers `@supabase/ssr` 0.10+ passes to `setAll` copied onto every response so a CDN never caches `Set-Cookie`, and a hand-written Origin check on any cookie-authenticated Route Handler. Refreshing in two places can revoke a session through refresh-token reuse detection, which shows up as users "randomly logged out". Sources, read 16 Nov 2026: [Supabase, Creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [supabase/ssr releases](https://github.com/supabase/ssr/releases), [Next.js proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) (updated 2026-11-06), [Next.js data security](https://nextjs.org/docs/app/guides/data-security) (2026-10-06).
2. In the browser, as the player app already does: supabase-js keeps the session in browser storage, refreshes it in the tab, and sends the access token in an `Authorization` header to PostgREST. Next.js serves pages that render no user data on the server. The Next.js 16 docs describe this as a supported single-page pattern, and `next/dynamic` with `ssr: false` keeps a client component out of server rendering (`node_modules/next/dist/docs/01-app/02-guides/single-page-applications.md` and `lazy-loading.md`, Next 16.4.5).

Nothing on a partner screen gains from server rendering: the counter board polls for new bookings, every other screen is a form, and search engines must not index any of it. Server-side fixtures would also be wrong: `sharedFixtureSession` is a module-level singleton (`packages/data/src/fixtures/session-store.ts`), so on a Next.js server every browser would share one fixture session.

## Decision

- `apps/partner` (`@gog/partner`) is a separate Next.js 16 App Router app on its own origin (`partner.<domain>`), deployed as its own Vercel project, `noindex` everywhere.
- All data access happens in the browser. The app builds one Supabase client per tab with a new `createBrowserSessionClient` from `@gog/data/client` (publishable key only, session in `localStorage` under a pinned `storageKey`, automatic refresh, requests through the server clock), and reads and writes only through the repositories of `@gog/data/partner`, `@gog/data/catalog` (areas and games for pickers) and `@gog/data/auth`. The signed-in shell is a client component loaded with `ssr: false`, so no client, repository or fixture store is created during server rendering.
- The Next.js server renders static shells and nothing else: no Server Actions, no Route Handlers that read or write data, no `cookies()` or `headers()`, no `proxy.ts`, no `@supabase/ssr`. It holds no secret and no session, so it is not the application server ADR 0003 defers. `@gog/eslint-config/partner` bans the imports and the `'use server'` directive that would change this.
- Sign-in is phone OTP through the existing `AuthGateway`. A person has one account for both apps.
- ADR 0004 still binds `apps/web` only. The website gets no sign-in; it may link to the partner app.
- ADR 0011's key rule now names `apps/partner` too: its environment schema refines the key with `isPublishableKey`, `PublishableKeyError` names the app, and `next.config.ts` refuses a secret key at build time, before Next inlines `NEXT_PUBLIC_*` values into the static client chunks, so the key is refused before it is public rather than in a visitor's browser.
- Fixtures run in the browser, one in-memory store per tab (ADR 0012). The build refuses `fixtures` on the production deployment.
- New bookings reach the counter by polling every 30 seconds. Supabase Realtime is a later decision.
- Cache Components stays off, as in `apps/web`. The server renders no data, so the next major release turning it on by default changes little here.

## Consequences

- None of the server-session failure modes exist: no cookie refresh to get wrong, no `Set-Cookie` for a CDN to cache, no refresh in two places. Requests carry the token in a header, not a cookie, so cross-site request forgery has nothing to ride on.
- A script injected into the page could read the session from `localStorage`. It could equally read `@supabase/ssr`'s default cookies, which are not `httpOnly`. The mitigations are the usual ones: no third-party scripts, React's escaping, and a Content-Security-Policy whose `connect-src` allows only the app and the Supabase origin.
- The first paint is a skeleton until the bundle runs. That is acceptable for a tab the counter keeps open all day and for a phone that loads it once per visit.
- Pinning the storage key means moving the API to a custom domain (ADR 0003) does not sign anyone out; supabase-js would otherwise derive the key from the first label of the API host (`sb-${hostname.split('.')[0]}-auth-token` in the installed 2.118.0).
- Two Next.js apps now share `next`, Tailwind and PostCSS, which move into the pnpm catalog (ADR 0002).
- Server rendering with cookie sessions remains possible later, under a new record; the repositories would not change. An Expo partner app would reuse `@gog/data/partner` unchanged.
