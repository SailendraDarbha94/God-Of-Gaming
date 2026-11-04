# 08. Sample data

Used by `@gog/data/fixtures` and `supabase/seed.sql`. Everything here is fictional development data; cafe names, addresses and prices are invented and must not be presented as real venues. Area names and coordinates are real public geography (approximate centres). UUIDs are fixed so both encodings agree; use the pattern `00000000-0000-4000-8000-0000000000NN` with a distinct two- or three-digit suffix per row and a leading group per table as shown.

## Cities

| id suffix        | slug        | name      | state       | lat     | lng     | live |
| ---------------- | ----------- | --------- | ----------- | ------- | ------- | ---- |
| `…-000000000001` | `bengaluru` | Bengaluru | Karnataka   | 12.9716 | 77.5946 | yes  |
| `…-000000000002` | `pune`      | Pune      | Maharashtra | 18.5204 | 73.8567 | no   |
| `…-000000000003` | `hyderabad` | Hyderabad | Telangana   | 17.3850 | 78.4867 | no   |

## Areas (Bengaluru), ids `…-0000000001NN`

| slug              | name            | lat     | lng     |
| ----------------- | --------------- | ------- | ------- |
| `koramangala`     | Koramangala     | 12.9352 | 77.6245 |
| `indiranagar`     | Indiranagar     | 12.9784 | 77.6408 |
| `hsr-layout`      | HSR Layout      | 12.9116 | 77.6389 |
| `whitefield`      | Whitefield      | 12.9698 | 77.7500 |
| `marathahalli`    | Marathahalli    | 12.9591 | 77.6974 |
| `jayanagar`       | Jayanagar       | 12.9308 | 77.5838 |
| `jp-nagar`        | JP Nagar        | 12.9063 | 77.5857 |
| `electronic-city` | Electronic City | 12.8399 | 77.6770 |
| `bellandur`       | Bellandur       | 12.9260 | 77.6762 |
| `btm-layout`      | BTM Layout      | 12.9166 | 77.6101 |
| `malleshwaram`    | Malleshwaram    | 13.0035 | 77.5647 |
| `rajajinagar`     | Rajajinagar     | 12.9915 | 77.5527 |
| `hebbal`          | Hebbal          | 13.0358 | 77.5970 |
| `yelahanka`       | Yelahanka       | 13.1007 | 77.5963 |
| `banashankari`    | Banashankari    | 12.9255 | 77.5468 |
| `sarjapur-road`   | Sarjapur Road   | 12.9100 | 77.6870 |
| `kalyan-nagar`    | Kalyan Nagar    | 13.0247 | 77.6400 |
| `basavanagudi`    | Basavanagudi    | 12.9416 | 77.5750 |

## Games, ids `…-0000000002NN`

| slug                         | name                       | kinds                 |
| ---------------------------- | -------------------------- | --------------------- |
| `valorant`                   | Valorant                   | pc                    |
| `counter-strike-2`           | Counter-Strike 2           | pc                    |
| `gta-vi`                     | Grand Theft Auto VI        | ps5, xbox             |
| `gta-v`                      | Grand Theft Auto V         | pc, ps5, xbox         |
| `ea-sports-fc-26`            | EA Sports FC 26            | pc, ps5, xbox, switch |
| `fortnite`                   | Fortnite                   | pc, ps5, xbox, switch |
| `call-of-duty-warzone`       | Call of Duty: Warzone      | pc, ps5, xbox         |
| `tekken-8`                   | Tekken 8                   | pc, ps5, xbox         |
| `mortal-kombat-1`            | Mortal Kombat 1            | pc, ps5, xbox, switch |
| `apex-legends`               | Apex Legends               | pc, ps5, xbox         |
| `dota-2`                     | Dota 2                     | pc                    |
| `marvel-rivals`              | Marvel Rivals              | pc, ps5, xbox         |
| `gran-turismo-7`             | Gran Turismo 7             | ps5                   |
| `assetto-corsa-competizione` | Assetto Corsa Competizione | pc, sim_racing        |
| `beat-saber`                 | Beat Saber                 | vr                    |
| `mario-kart-world`           | Mario Kart World           | switch                |

## Cafes

Ids: cafes `…-00000000030C` (C = 1…6 in table order; Pixel Den = `…-000000000301`). Tiers `…-0000000003CT` (T = 1…3 in the order listed per cafe; Pixel Den Standard PC = `…-000000000311`). Stations `…-00000003CTSS` (SS = 01…24; Pixel Den Standard PC station 7 = `…-000000031107`). Images `…-0000000005CN` (N = 1…3). Promotions `…-000000000401`…`0404`. All keep version nibble `4` and variant `8`, which Zod 4's strict `z.uuid()` requires. Station labels are a per-tier prefix plus two digits, so two PC tiers in one cafe never share a label: `STD-01` (Standard PC), `PRM-` (Premium PC), `PRO-` (Pro PC), `ELT-` (Elite PC), `STG-` (Stage PC), `ROOM-` (Private Squad Room), `PS5-`, `XBX-`, `NSW-` (Switch), `VR-`, `SIM-`.

All six are `live`. Hours unless noted: Sun–Thu 10:00–23:00; Fri–Sat 10:00–02:00 overnight. Images use `https://picsum.photos/seed/<cafe-slug>-<n>/1200/800` (three per cafe; placeholders only). Amenities are chosen from: `ac`, `parking`, `food`, `cafe`, `private-room`, `streaming-setup`, `tournament-ready`, `wheelchair-access`, `late-night`.

| slug                          | name             | area         | address (fictional)            | whatsapp | tiers (name · kind · ₹/hr · stations · specs)                                                                                                 | games                                                                              |
| ----------------------------- | ---------------- | ------------ | ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `pixel-den-koramangala`       | Pixel Den        | koramangala  | 12, 5th Block, Koramangala     | —        | Standard PC · pc · 80 · 12 · RTX 4060, 165 Hz; Premium PC · pc · 120 · 8 · RTX 5070, 240 Hz; PS5 Lounge · ps5 · 150 · 4 · 55" 4K              | valorant, counter-strike-2, ea-sports-fc-26, gta-v, fortnite, marvel-rivals        |
| `frame-rate-indiranagar`      | Frame Rate       | indiranagar  | 100 Feet Road, Indiranagar     | —        | Pro PC · pc · 110 · 16 · RTX 5070 Ti, 360 Hz; Sim Rig · sim_racing · 300 · 2 · Fanatec, triple screen                                         | valorant, counter-strike-2, apex-legends, dota-2, assetto-corsa-competizione       |
| `respawn-room-hsr`            | Respawn Room     | hsr-layout   | 27th Main, HSR Layout Sector 1 | —        | Standard PC · pc · 70 · 20 · RTX 4060, 144 Hz; PS5 · ps5 · 140 · 6 · 4K TV; Private Squad Room · pc · 150 · 5 · RTX 5080, 240 Hz, closed room | valorant, counter-strike-2, call-of-duty-warzone, ea-sports-fc-26, tekken-8, gta-v |
| `overclock-lounge-whitefield` | Overclock Lounge | whitefield   | ITPL Main Road, Whitefield     | —        | Elite PC · pc · 130 · 10 · RTX 5080, 240 Hz OLED; VR Bay · vr · 250 · 2 · Quest 3, roomscale                                                  | valorant, counter-strike-2, apex-legends, beat-saber, marvel-rivals                |
| `side-quest-jayanagar`        | Side Quest       | jayanagar    | 4th Block, Jayanagar           | —        | PS5 · ps5 · 150 · 6 · 4K TV; Xbox · xbox · 140 · 2 · Series X; Switch Corner · switch · 100 · 2 · Switch 2                                    | gta-vi, gta-v, ea-sports-fc-26, mortal-kombat-1, gran-turismo-7, mario-kart-world  |
| `clutch-arena-marathahalli`   | Clutch Arena     | marathahalli | Outer Ring Road, Marathahalli  | —        | Standard PC · pc · 75 · 24 · RTX 4060, 165 Hz; Stage PC · pc · 140 · 10 · RTX 5080, 360 Hz, tournament stage                                  | valorant, counter-strike-2, dota-2, apex-legends, fortnite, call-of-duty-warzone   |

Side Quest hours: daily 11:00–23:30, no overnight. Clutch Arena: Fri–Sat 10:00–04:00 overnight.

Descriptions: two or three sentences each, plain, no superlatives. Give each cafe a `maps_url` of the form `https://maps.google.com/?q=<lat>,<lng>`. `whatsapp` is `null` for every sample cafe: India has no reserved fictional mobile range (the 99999 series is allocated to live operators), and the website publishes the column as schema.org `telephone`, so a seeded project behind a public deployment must not advertise a number nobody controls. The only 99999-series number in the repository is the local test-OTP entry `919999900001` in `supabase/config.toml`, for which GoTrue sends no SMS.

## Promotions, ids `…-0000000004NN`

| slug                     | title                                       | cafe                      | city      | starts (IST)     | ends (IST)       | featured | CTA                                                            |
| ------------------------ | ------------------------------------------- | ------------------------- | --------- | ---------------- | ---------------- | -------- | -------------------------------------------------------------- |
| `gta-vi-launch-night`    | GTA VI launch night                         | side-quest-jayanagar      | bengaluru | 2026-11-19 18:00 | 2026-11-20 02:00 | yes      | "Reserve a PS5 in the app" → `gog://cafe/side-quest-jayanagar` |
| `squad-saturdays`        | Squad Saturdays: book 5 seats, play 6 hours | —                         | bengaluru | 2026-11-07 00:00 | 2027-01-31 23:59 | yes      | "Find a cafe" → `/cafes`                                       |
| `valorant-community-cup` | Valorant community cup, December qualifiers | clutch-arena-marathahalli | bengaluru | 2026-12-05 11:00 | 2026-12-06 22:00 | no       | "Read the rules" → `/events/valorant-community-cup`            |
| `late-night-pc-rates`    | Late-night PC rates at Pixel Den            | pixel-den-koramangala     | bengaluru | 2026-11-04 00:00 | —                | no       | —                                                              |

Each has a `summary` of one sentence and a `body` of two short markdown paragraphs; `is_published = true`; images from picsum with the promotion slug as the seed.
