# Architecture decision records

Each file records one decision that is hard to reverse or that a new contributor would otherwise have to guess at. We use the Nygard format: context, decision, consequences. A record is never rewritten after it is accepted; a later record supersedes it and both link to each other.

| No.                                                         | Title                                                                  | Status   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)               | Record architecture decisions                                          | Accepted |
| [0002](0002-monorepo-with-pnpm-and-turborepo.md)            | Monorepo with pnpm workspaces and Turborepo                            | Accepted |
| [0003](0003-supabase-as-the-backend.md)                     | Supabase as the backend, no application server yet                     | Accepted |
| [0004](0004-website-is-a-showcase-not-a-booking-surface.md) | The website is a showcase, not a booking surface                       | Accepted |
| [0005](0005-booking-integrity-in-postgres.md)               | Booking integrity is enforced in Postgres                              | Accepted |
| [0006](0006-bengaluru-first.md)                             | Bengaluru first, multi-city data model                                 | Accepted |
| [0007](0007-share-schemas-and-data-access-not-ui.md)        | Share schemas and data access between apps, not UI                     | Accepted |
| [0008](0008-expo-development-builds-and-expo-router.md)     | Expo development builds, Expo Router, generated native projects        | Accepted |
| [0009](0009-money-in-paise-and-time-in-utc.md)              | Money in integer paise, time in UTC                                    | Accepted |
| [0010](0010-toolchain-and-quality-gates.md)                 | Toolchain and quality gates                                            | Accepted |
| [0011](0011-security-posture.md)                            | Security posture: RLS everywhere, writes through functions             | Accepted |
| [0012](0012-data-access-behind-repository-interfaces.md)    | Data access behind repository interfaces with a fixture implementation | Accepted |

To add one: copy the newest file, take the next number, set the status to Proposed, open a pull request. Set it to Accepted when merged.
