# 0005. Booking integrity is enforced in Postgres

Date: 2026-11-04
Status: Accepted

## Context

The failure that kills a booking product is two squads arriving for the same seats. Several clients will write bookings over time (player app, a counter tool, possibly a partner integration), and none of them can be trusted to agree on availability under concurrency.

## Decision

- A booking is a group of seats. Each seat is one row in `booking_seats` with a specific `station_id` and a `tstzrange` column `during` (`[start, end)`).
- An exclusion constraint guarantees no two unreleased seats overlap on the same station:
  `EXCLUDE USING gist (station_id WITH =, during WITH &&) WHERE (released_at IS NULL)` (requires `btree_gist`).
- Seats are allocated by the SQL function `create_booking`, which validates the request, checks opening hours, serialises allocation per tier with a transaction-scoped advisory lock and selects free stations under a fresh snapshot (the exclusion constraint remains the final guard), inserts the booking as `held` with a ten-minute `hold_expires_at`, and inserts the seats. If the exclusion constraint still fires under a race, the function raises `GG005` and the client retries once.
- Cancelling or expiring a booking sets `released_at` on its seats; rows are never deleted, so history stays intact and the constraint ignores them.
- `expire_holds()` runs every minute under `pg_cron` and expires held bookings whose hold has lapsed.
- Clients compute nothing authoritative. `get_availability` returns free seat counts per start time for a given duration; the client uses it for display only and `create_booking` is the final word.
- `create_booking` also caps what one account can hold: three live holds and ten upcoming bookings at once (`GG009`), counted under a per-user advisory lock, so no single phone number can hoard a cafe's seats; the Seat Lock fee remains the deterrent once payments ship.
- Function errors use custom SQLSTATE codes `GG001` to `GG009` (see `docs/spec/03-database.md`); `@gog/data` maps them to typed errors.

## Consequences

- Correctness does not depend on which client wrote the booking.
- Every change to booking rules is a migration with a pgTAP test, which is slower to write than TypeScript but is tested against the real constraint.
- Seats are allocated to specific stations at hold time. Cafes that want to reshuffle seats on the day will need a counter tool action for that; it is deliberately not possible from the player app.
