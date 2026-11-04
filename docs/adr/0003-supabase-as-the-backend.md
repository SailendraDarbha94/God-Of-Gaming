# 0003. Supabase as the backend, no application server yet

Date: 2026-11-04
Status: Accepted

## Context

The founder considered NestJS or FastAPI with Firebase or Supabase "for starters". The research report recommended Supabase (Postgres in Mumbai, `ap-south-1`) and rejected Firestore for bookings because booking integrity needs transactions and range constraints, which Postgres gives us for free. A one-person team cannot carry an application server, its deployment and its on-call in addition to two apps.

## Decision

- Supabase is the backend: Postgres for data and business rules, Supabase Auth for phone OTP sign-in, Supabase Storage for cafe images, PostgREST for reads and remote procedure calls.
- Business rules that protect data (allocation of seats, holds, state transitions) live in SQL functions with `SECURITY DEFINER` and explicit checks. Clients never write to booking tables directly. See ADR 0005 and ADR 0011.
- No NestJS or FastAPI service now. A service (`apps/api`, NestJS, same Postgres) is added only when one of these named triggers fires:
  1. Payment orchestration needs more than a webhook handler and a function call (for example reconciliation across Razorpay Route or Cashfree Easy Split and manual payouts).
  2. Background work exceeds what `pg_cron` and Supabase Edge Functions do comfortably (fan-out notifications at scale, long-running integrations).
  3. An integration needs a persistent connection or a non-HTTP protocol (cafe PC management software, hardware at the counter).
  4. A second engineer joins who will own the backend.
- Production uses a custom domain for the Supabase project (API and auth URLs under our own subdomain). The report found `supabase.co` blocked on some Indian ISPs for about a week in February to March 2026; shipped apps must not depend on that hostname.
- SMS OTP in production goes through a DLT-registered Indian vendor via Supabase's Send SMS hook, not Supabase's default provider.

## Consequences

- Reads are cheap and cacheable; the website needs only the anon key and RLS.
- Logic in SQL needs tests in SQL. We use pgTAP via `supabase test db` (ADR 0010).
- Vendor lock-in is limited to Auth and Storage; the schema, functions and policies are plain Postgres and would move with us.
- Local development needs either Docker (full Supabase stack) or a local Postgres plus the shim in `supabase/local/` for schema work only.
