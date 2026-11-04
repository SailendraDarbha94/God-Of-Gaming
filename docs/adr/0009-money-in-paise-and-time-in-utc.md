# 0009. Money in integer paise, time in UTC

Date: 2026-11-04
Status: Accepted

## Context

Prices are per hour per station tier (₹80 to ₹250 typical), bookings are 30-minute multiples, and a squad booking multiplies both. Floating point and local time are the two classic sources of off-by-one bugs here, and India has no daylight saving.

## Decision

- Every amount is an integer number of paise. Column and field names end in `_paise` / `Paise`. No floats, no decimals anywhere in storage or transport. Formatting to rupees happens at the display edge with `Intl.NumberFormat('en-IN')`.
- Every instant is a `timestamptz` stored in UTC and transported as an ISO 8601 string. Opening hours are local times (`time`) per weekday plus an `is_overnight` flag for closing after midnight.
- Domain code treats IST as a fixed offset of +05:30 (`IST_OFFSET_MINUTES = 330`) and does not depend on a date-time library. This is explicitly India-only; expanding outside India means replacing these helpers with a time-zone library, under a new ADR.
- Durations are integer minutes; booking durations are multiples of 30 between 30 and 360.

## Consequences

- Arithmetic is exact and comparable across SQL and TypeScript; the same quote calculation is tested in both.
- Rendering code is the only place that knows about rupees or IST wall-clock time.
