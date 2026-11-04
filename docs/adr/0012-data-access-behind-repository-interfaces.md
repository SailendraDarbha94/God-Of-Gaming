# 0012. Data access behind repository interfaces with a fixture implementation

Date: 2026-11-04
Status: Accepted

## Context

Both apps need the same reads (cafes, areas, promotions) and the player app needs booking calls. Developers will not always have a Supabase stack running (this machine has no Docker today), CI should build the website with real-looking content, and tests should not need a network.

## Decision

- `@gog/data` exposes two interfaces: `CatalogRepository` (reads) and `BookingRepository` (availability, holds, confirm, cancel, my bookings).
- Two implementations each: `supabase` (PostgREST via supabase-js, rows mapped to domain types and validated with Zod) and `fixtures` (in-memory, deterministic sample data for Bengaluru; the booking fixture simulates holds in memory).
- Apps choose the implementation from one environment variable (`GOG_DATA_SOURCE`, `supabase` or `fixtures`), never by importing a concrete class. Production builds refuse `fixtures`.
- The sample dataset is described once in `docs/spec/08-sample-data.md`; the fixtures and `supabase/seed.sql` both encode it. Generating one from the other is a follow-up.

## Consequences

- `pnpm dev:web` works on a laptop with no database and shows real pages; CI builds the site with fixtures and does not depend on a running Supabase.
- Mappers are the only place raw rows are touched, and they are unit-tested against recorded row shapes.
- Two implementations can drift; the interface and the shared contract tests (`describeCatalogRepository(factory)`) run against both, which keeps them honest.
