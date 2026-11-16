# 08. Sample data additions

Additions to `docs/spec/08-sample-data.md`, which M1 amends. `supabase/seed.sql` and the fixtures (`packages/data/src/fixtures/bengaluru.ts` for the public dataset, `fixtures/world.ts` for the partner state) encode them together, with the same fixed UUIDs (version nibble `4`, variant `8`). Everything is fictional, as before.

## Reference data moves to a migration (M0)

The three cities, the 18 Bengaluru areas and the 16 games of `docs/spec/08-sample-data.md` move from `seed.sql` to migration `20261117115900_reference_data.sql`, with the same UUIDs and `on conflict do nothing`, so every project gets them from `db push`, production included, which never runs the seed. They are real public geography and real game titles, not fictional rows. The fixtures keep them in `bengaluru.ts` as before; the seed keeps the cafes and everything that hangs off them.

## New columns on the six live cafes

| Column                     | Value                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `app_bookings_enabled`     | `true`                                                                                                     |
| `app_notice_minutes`       | 30, except Clutch Arena, 180 (so the player app shows a longer notice somewhere)                           |
| `no_show_grace_minutes`    | 15                                                                                                         |
| `first_published_at`       | `2026-11-04 10:00 IST`                                                                                     |
| `app_bookings_approved_at` | `2026-11-04 10:00 IST`, so an owner may switch app bookings off and on again, as the M4 contract case does |
| `suspended_at`             | null                                                                                                       |
| `stations.is_app_bookable` | `true` for every station of the six                                                                        |

With every station pledged and the notice at its minimum, iteration 1's pgTAP tests and the booking contract suite behave as before, except 006's free-seats case, which moves from a fixed Friday to one computed from today (`03-database.md`, Changed booking functions). No pgTAP file or contract suite books Clutch Arena.

## A seventh cafe, a draft

| Field               | Value                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| id, slug, name      | `…-000000000307`, `level-up-btm`, Level Up Lounge                                                                                                     |
| area                | `btm-layout` (`…-000000000110`); coordinates at the area centre, 12.9166, 77.6101; `maps_url` `https://maps.google.com/?q=12.9166,77.6101`            |
| status              | `draft`; `first_published_at` null; `app_bookings_enabled` false; `app_bookings_approved_at` and `suspended_at` null; notice 180; grace 15            |
| address (fictional) | 16th Main, BTM Layout 2nd Stage                                                                                                                       |
| description         | Two or three plain sentences, as for the others                                                                                                       |
| amenities; WhatsApp | `ac`, `food`; none                                                                                                                                    |
| hours               | Daily 11:00–23:00, not overnight                                                                                                                      |
| tiers               | Standard PC (`…-000000000371`) · pc · ₹70 · specs RTX 4060, 144 Hz; PS5 (`…-000000000372`) · ps5 · ₹130 · specs 4K TV                                 |
| stations            | `STD-01`…`STD-06` (`…-000000037101`…`06`): `STD-01` and `STD-02` pledged, `STD-06` inactive; `PS5-01`, `PS5-02` (`…-000000037201`, `02`): not pledged |
| games               | valorant, counter-strike-2, ea-sports-fc-26, gta-v                                                                                                    |
| images              | none, so the preview shows a cafe without a cover and the publish checklist still passes                                                              |

Anonymous readers never see it: pgTAP 005 keeps asserting six live cafes and six cards. Its members see it through `partner_cafe`, with the inactive station and the unpledged ones. It has no owner's terms acceptance, so the publish gate refuses it until the owner persona accepts.

The public fixture dataset (`bengaluru.ts`) still holds only what an anonymous reader may see: the six live cafes, now with the new fields. Level Up Lounge lives only in the fixture world.

## Personas

| Persona  | Phone           | Code   | Role after the first sign-in                                                                                                                                                                         | How                                                                                                                     |
| -------- | --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Player   | `+919999900001` | 123456 | none                                                                                                                                                                                                 | Iteration 1's test number                                                                                               |
| Owner    | `+919999900002` | 123456 | owner of Pixel Den and of Level Up Lounge                                                                                                                                                            | Seeded invites                                                                                                          |
| Staff    | `+919999900003` | 123456 | staff of Pixel Den                                                                                                                                                                                   | Seeded invite                                                                                                           |
| Stranger | `+919999900004` | 123456 | none; also the booker in the partner contract suite, so the booking suite's player keeps its caps to itself, and briefly staff of Level Up in its M2 invite case, which removes the membership again | No seeded invite                                                                                                        |
| Operator | `+919999900009` | 123456 | operator                                                                                                                                                                                             | Inserted into `platform_operators` after the stack starts (CI, README), never by the seed; built into the fixture world |

The four new numbers join `[auth.sms.test_otp]` in `supabase/config.toml`, for which GoTrue sends no SMS. They are for local stacks and CI only: the repository is public, so a hosted project must never accept these numbers with these codes. On fixtures, any number signs in with 123456, and these five behave as the table says.

## Invites

`cafe_invites` rows, ids `…-0000000006NN`, each pending, `invited_by` null, and `expires_at` `2099-12-31 23:59 IST`, so a long-lived local stack does not lose its personas (invites created through `invite_cafe_member` still expire after 14 days):

| id               | cafe            | phone          | role  |
| ---------------- | --------------- | -------------- | ----- |
| `…-000000000601` | Pixel Den       | `919999900002` | owner |
| `…-000000000602` | Level Up Lounge | `919999900002` | owner |
| `…-000000000603` | Pixel Den       | `919999900003` | staff |

## Numbers for tests that are not personas

pgTAP files 007 to 013 insert their own users, with `phone_confirmed_at` set and claims whose `amr` says `otp` (`03-database.md`, pgTAP), and the contract suite sends its test invites, with `+9199998000NN` numbers (`919999800001` to `919999800099` as stored). They are never `test_otp` numbers, nothing sends them a message, and no committed file signs in with them.

## Fixture-only board content

With `sampleBookings: true` (the default for `sharedFixtureWorld()`, so for `pnpm dev:partner` on fixtures), the fixture world adds these rows at Pixel Den, relative to its clock and kept on the 30-minute grid where app bookings need it. The seed has no bookings, as in iteration 1, and the contract suites create worlds without them.

| id               | Kind                                        | Tier and stations          | Time                                                                     | State                                    |
| ---------------- | ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| `…-000000910001` | app, 1 seat                                 | PS5 Lounge, `PS5-01`       | from the next half hour (so inside its check-in window), for 120 minutes | confirmed, not acknowledged (the banner) |
| `…-000000910002` | app, 3 seats                                | Standard PC, `STD-01`–`03` | from the half hour before now, for 120 minutes                           | confirmed, acknowledged, checked in      |
| `…-000000910003` | counter block, walk-in, note "Window seats" | Standard PC, `STD-04`      | from 15 minutes ago, for 60 minutes                                      | confirmed                                |
| `…-000000910004` | counter block, phone, 2 seats               | Premium PC, `PRM-01`–`02`  | the next 20:00 IST, for 120 minutes                                      | confirmed                                |
| `…-000000910005` | app, 1 seat                                 | Standard PC, `STD-05`      | from the first half hour at least 120 minutes ahead, for 60 minutes      | held, with a live hold                   |

The app bookings belong to two invented players, `…-000000920001` and `…-000000920002`, who have no phone number and appear nowhere else. Their booking codes are the last six characters of the ids (`910001` and so on). The Playwright smoke test relies on row 1 (acknowledge, search, and from M5 check in, move to `PS5-03`, complete) and on `PS5-02` being free for its walk-in.
