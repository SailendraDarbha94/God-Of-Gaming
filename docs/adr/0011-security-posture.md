# 0011. Security posture: RLS everywhere, writes through functions

Date: 2026-11-04
Status: Accepted

## Context

Both apps talk to Postgres through PostgREST with a public (anon) key that anyone can read out of the bundle. The database is therefore the security boundary. India's DPDP rules (in force around May 2027 per the report) and the E-Commerce rules also push us towards collecting little and being able to delete it.

## Decision

- Row Level Security is enabled on every table in `public`. A table without a policy is unreadable, which is the safe default. pgTAP asserts RLS is on for every table.
- Anonymous and authenticated roles get read access only to published content: live cafes and their tiers, hours, images and games; live cities and areas; published promotions. Draft or paused cafes are invisible.
- Nobody inserts or updates booking rows directly. All writes go through `SECURITY DEFINER` functions that check `auth.uid()` and the caller's relationship to the row. Functions set an explicit `search_path`.
- The service-role key is never present in `apps/web` or `apps/player`. It is used only by CI, scripts and, later, server-side jobs.
- Secrets come from environment variables validated with Zod at startup. `.env.example` files are committed; `.env*` files are not.
- Sign-in is phone OTP via Supabase Auth. We store a phone number and an optional display name, nothing else, until a feature needs more.
- Before public launch: a privacy notice, a deletion path (`delete_my_account` function) and consent wording per the DPDP rules, tracked as issues, not left implicit.

## Consequences

- Leaking the anon key costs nothing beyond what the public site already shows.
- New tables need policies and a test before they are useful, which is the point. Table-level write privileges are revoked from `anon` and `authenticated` as well (migration `20261104122800`), so a policy mistake cannot open direct writes; a table created in the dashboard needs the same revoke.
- "The anon key is the only key in the apps" is enforced, not assumed: `assertPublishableKey` in `@gog/data` refuses `sb_secret_*` keys and any JWT whose role is not `anon` before supabase-js sees them, and both apps' environment schemas refine the key variable the same way. The player's check runs at app start, so a wrong key in a release bundle is loud but already inlined; a pre-bundle gate is a follow-up.
- Secrets that once reached git are rotated, not merely removed: a Firebase web API key for an unrelated project sits in seven commits of the pushed history (`app/lib/firebaseConfig.ts`, before the monorepo). CI now runs a secret scan over every pushed commit range; the key itself must be regenerated or restricted in Google Cloud, GitHub's open secret-scanning alert closed as revoked, and the monorepo's first commit made on a fresh root so the old commits leave the default branch (see `docs/spec/INTEGRATION.md`, Review fixes).
