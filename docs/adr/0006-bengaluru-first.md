# 0006. Bengaluru first, multi-city data model

Date: 2026-11-04
Status: Accepted

## Context

The report suggested Pune as a first city on the basis of search interest and competitor coverage. The founder lives in Bengaluru and will sign cafes in person, which the report identified as the decisive factor for supply. Bengaluru it is.

## Decision

- The data model is multi-city from day one: `cities` → `areas` → `cafes`. Exactly one city is live at launch, slug `bengaluru`, and both apps default to it. Other cities can be seeded but stay `is_live = false`.
- Areas are seeded for Bengaluru (Koramangala, Indiranagar, HSR Layout, Whitefield, Marathahalli, Jayanagar, JP Nagar, Electronic City, Bellandur, BTM Layout, Malleshwaram, Rajajinagar, Hebbal, Yelahanka, Banashankari, Sarjapur Road, Kalyan Nagar, Basavanagudi), each with an approximate centre.
- The spelling is "Bengaluru" in data and UI; "Bangalore" appears in page metadata as a synonym so search still finds us.
- Time zone handling assumes India (IST, fixed +05:30) everywhere. See ADR 0009.

## Consequences

- Adding a second city is data plus a flag, not code.
- Any ranking or "near me" feature can start with area-level filtering; coordinates are stored so distance sorting can follow without a migration.
