# God of Gaming (working title)

A booking aggregator for gaming cafes in India, starting in Bengaluru. Players find a cafe, see its PC tiers, consoles, games, prices and hours, hold seats for their squad in the app and confirm. The website showcases cafes and promotions and sends people to the app.

The research behind the product is in [the report](https://claude.ai/artifact/RJfi7JsMSucfHGEvGhYejQ) (Claude Doc) with its evidence under `research_notes/`. Decisions are recorded in [`docs/adr/`](docs/adr/README.md); the build target for the current iteration is in [`docs/spec/`](docs/spec/README.md).

## What is in the repository

| Path                                          | Package       | What                                                                                                              |
| --------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/web`                                    | `@gog/web`    | Next.js 16 showcase website: cafes, areas, events, download, for cafes. No booking, no accounts (ADR 0004).       |
| `apps/player`                                 | `@gog/player` | Expo SDK 58 player app: explore, cafe detail, squad booking (hold → confirm), my bookings, phone OTP sign-in.     |
| `packages/domain`                             | `@gog/domain` | Zod schemas, types and pure rules (prices, slots, opening hours, booking validation). No I/O.                     |
| `packages/data`                               | `@gog/data`   | Repository interfaces with Supabase and fixture implementations, generated database types, mappers, auth gateway. |
| `packages/tsconfig`, `packages/eslint-config` |               | Shared TypeScript and ESLint configuration.                                                                       |
| `supabase/`                                   |               | Postgres migrations, SQL functions, RLS policies, pgTAP tests, seed, and a no-Docker local shim.                  |
| `docs/`                                       |               | ADRs and the iteration spec.                                                                                      |

## Prerequisites

- Node 22 (`.nvmrc`), pnpm 10 (`corepack enable` or `npm i -g pnpm`).
- For database work: either Docker (full local Supabase stack via the Supabase CLI) or Homebrew Postgres 17 for the schema-only path below. Supabase CLI 2.116.0, the version CI installs (`.github/workflows/ci.yml`): `brew install supabase/tap/supabase` tracks the latest 2.x, so when the formula has moved on, run the pinned version with `npx supabase@2.116.0 <command>`; upgrade local and CI together, not to v3 on its own (v3 changes the default target and the `--local`/`--db-url` flags). To run the SQL tests without Docker you need the `pgtap` extension; Homebrew has no formula, so build it from source against `postgresql@17` (`make PG_CONFIG="$(brew --prefix postgresql@17)/bin/pg_config" && make install`, then `cpanm TAP::Parser::SourceHandler::pgTAP` for `pg_prove`), or run them with Docker (`pnpm db:test`).
- For the player app: Xcode (iOS simulator) or Android Studio, and EAS CLI (`npm i -g eas-cli`) for cloud builds.

## Getting started

```bash
pnpm install
```

```bash
pnpm check
```

Run the website with sample data, no backend needed:

```bash
GOG_DATA_SOURCE=fixtures pnpm dev:web
```

Then open http://localhost:3000. To point at a Supabase project instead, copy `apps/web/.env.example` to `apps/web/.env.local`, set `GOG_DATA_SOURCE=supabase` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon key only; the app refuses a service-role key at startup).

Run the player app (needs a development build on a simulator; the first time, `pnpm --filter @gog/player ios`):

```bash
pnpm dev:player
```

Copy `apps/player/.env.example` to `apps/player/.env` first. With `EXPO_PUBLIC_DATA_SOURCE=fixtures` the catalog and booking flow work against in-memory sample data.

## Database

With Docker:

```bash
pnpm db:start
```

```bash
pnpm db:reset
```

```bash
pnpm db:test
```

Without Docker (schema, seed, SQL tests and type generation; no Auth, Storage or API). `pnpm db:local:types` runs the generator the Supabase CLI would start in a container (`@supabase/postgres-meta`, a root devDependency pinned to the CLI's image version) directly with Node, so the output matches CI byte for byte. `pnpm db:local:test` reports the SQL tests as skipped until the `pgtap` extension is installed (see Prerequisites):

```bash
pnpm db:local:up && pnpm db:local:reset
```

```bash
pnpm db:local:test
```

```bash
pnpm db:local:types
```

Pointing at a real project: create a Supabase project in `ap-south-1` (Mumbai), run `supabase link --project-ref <ref>` and `supabase db push`, then set the URL and anon key in the apps' env files. Production needs a custom domain for the API (ADR 0003).

## Scripts

`pnpm dev`, `build`, `lint`, `typecheck`, `test`, `check` (lint + typecheck + test), `format`, `format:check`, and the `db:*` scripts above. Every package has `lint` and `typecheck` except the two config-only ones (`@gog/eslint-config` has `lint`, `@gog/tsconfig` has neither); the domain, data, web and player packages have `test` (the player's covers its pure helpers). The player app also has `run doctor` (`expo-doctor`; `pnpm doctor` without `run` is pnpm's own command) and `assets` (regenerates the icon PNGs).

## Testing against a real Supabase stack

`pnpm check` runs the fixture implementations of `@gog/data` and skips the Supabase contract suites. To run those too, point them at a seeded stack (`pnpm db:start` with Docker, or a hosted project with the seed applied) and set `GOG_TEST_SUPABASE_URL` and `GOG_TEST_SUPABASE_ANON_KEY` (`supabase status -o env` prints both as `API_URL` and `ANON_KEY`); `GOG_TEST_SUPABASE_PHONE` (default `+919999900001`) and `GOG_TEST_SUPABASE_OTP` (default `123456`) must match an `[auth.sms.test_otp]` entry in `supabase/config.toml`. The booking suite holds and then cancels Pixel Den Standard PC seats one week ahead, so use a stack nobody else is booking on. CI does this on every run.

## How we work

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). In short: small pull requests, Conventional Commits, CI must pass, decisions go in an ADR, the spec says what to build.

CI (`.github/workflows/ci.yml`) runs on every pull request and push to `main`: `check` scans the pushed commits for secrets (gitleaks), installs with a frozen lockfile, checks formatting, lints, typechecks and tests every package, builds the website against fixtures and runs `expo-doctor`; `database` starts the local stack with Supabase CLI 2.116.0, applies the migrations and seed, runs the pgTAP tests, fails if `packages/data/src/database.types.ts` differs from the generated types, and runs the `@gog/data` contract suites against the real PostgREST and GoTrue. VS Code users get Prettier on save, ESLint per package and the recommended extensions from `.vscode/`.

## Status

Iteration 1 (foundations): see `docs/spec/01-product-scope.md` for what is in and out. Nothing here is deployed yet. The sample cafes are fictional.

## Open decisions for the founder

- Partner surface for cafes. Recommendation: a Next.js dashboard (`apps/partner`) first, because cafe counters have a PC, it ships without store review, and it reuses `@gog/data`; an Expo partner app can follow when owners need it on their phones. The data model and RLS (`cafe_members`) already support either.
- Product name and domain (the report flagged "God of Gaming" for a trademark check), Apple and Google developer accounts, the Supabase project.
