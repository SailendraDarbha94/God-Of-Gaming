# 07. Standards and verification

## Code

- TypeScript strict everywhere; no `any`, no non-null assertions except with a comment that says why; `unknown` at every boundary and Zod to narrow it.
- Validate at the edges (environment, network responses, user input), trust the inside. Domain types are produced only by Zod `parse` in mappers and validators.
- Pure before impure: rules live in `@gog/domain`; I/O lives in `@gog/data`; apps compose. A function that touches the network does not also compute prices.
- Errors are values at the domain layer (`Result`) and typed exceptions at the data layer (`DataError`, `BookingError`). Never throw strings, never swallow errors without logging.
- Exhaustive `switch` over enums (`switch-exhaustiveness-check`), no default branch that hides a new case.
- Names say what things are: `hourlyRatePaise`, not `price`; `startsAt`, not `time`. Booleans read as predicates (`isLive`, `isOvernight`).
- Files are small and named after the one thing they export; tests sit next to the code as `*.test.ts`.
- Components: server components by default on the web; on native, screens compose hooks and components and hold no business logic.
- No dead code, no TODO without an owner and a reason, no commented-out blocks.
- Comments explain why, not what. Every SQL function has a header comment with its contract and error codes.
- Dependencies: add one only when it saves real code; prefer the platform (`Intl`, `URL`, `fetch`). Each package declares what it imports.
- Secrets never in code or in git; `.env.example` lists every variable with a comment.

## Database

- One concern per migration file, reversible by a new migration (we never edit an applied migration).
- RLS in the same migration as the table. Functions `security definer` only when they must be, with `search_path` set and `revoke execute from public, anon and authenticated` first (Supabase's default privileges grant every new `public` function to `anon` and `authenticated` directly; revoking from `public` alone leaves those grants in place).
- Every function and every policy has at least one pgTAP test.

## Tooling

- Format with Prettier (`pnpm format`); lint with ESLint (`pnpm lint`); typecheck with `tsc --noEmit` per package (`pnpm typecheck`); test with Vitest (`pnpm test`, in the two packages, the website and, for its pure helpers, the player app). `pnpm check` runs lint, typecheck and test through Turborepo.
- `turbo.json` declares a transit task `topo` (`"dependsOn": ["^topo"]`, no script behind it) that `lint`, `typecheck` and `test` depend on: packages are consumed as TypeScript source (ADR 0002), so a change in `@gog/domain`, `@gog/data`, `@gog/tsconfig` or `@gog/eslint-config` must miss the cache of every dependent while the tasks still run in parallel. No package may add a script named `topo`. The `dev` task passes `GOG_DATA_SOURCE`, `NEXT_PUBLIC_*`, `VERCEL_ENV` and the deep-link variables through (strict env mode would otherwise hide `GOG_DATA_SOURCE=fixtures pnpm dev:web`), and the player's `typecheck` and `doctor` declare the variables `app.config.ts` reads at config time.
- Conventional Commits. Scopes are package names (`web`, `player`, `domain`, `data`, `db`, `ci`, `docs`).
- A pull request is small, describes the why, links the spec section or ADR, and passes CI.

## CI (`.github/workflows/ci.yml`)

Trigger on pull requests and pushes to `main`. Two jobs:

1. `check` (ubuntu-latest): `actions/checkout` with `fetch-depth: 0`, `gitleaks/gitleaks-action@v2` (a secret scan over the pushed or pull-request commits, the CI gate for "secrets never in code or in git"; the action takes no `--no-git`, so it scans the commit range, which is why the checkout fetches the history; a user-owned repository needs no licence, and no `.gitleaks.toml` allowlist is needed because the example env files hold only blanks and placeholders and the tests build their sample JWTs at runtime), `pnpm/action-setup` (reads `packageManager`), `actions/setup-node` 22 (from `.nvmrc`) with pnpm cache, `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm turbo run lint typecheck test`, then `pnpm turbo run build --filter=@gog/web` with `GOG_DATA_SOURCE=fixtures` and a placeholder `NEXT_PUBLIC_SITE_URL` (optional: the build needs no site URL outside the production deployment, the placeholder only makes CI's canonical URLs realistic), then `pnpm --filter @gog/player exec expo-doctor` (allowed to fail only if the network is down, which the workflow checks by probing api.expo.dev and registry.npmjs.org; otherwise required).
2. `database` (ubuntu-latest): `supabase/setup-cli@v3` (the current major; `@v1`/`@v2` are legacy) with `version: 2.116.0` (never `latest`: that is Supabase CLI v3 since 2026-11-02, which makes local the default target, turns `--local` into a warning no-op, deprecates `--db-url` and rewords errors), `supabase start` excluding the services nothing needs (`-x studio,imgproxy,edge-runtime,logflare,vector,realtime,supavisor,mailpit`; Postgres, Kong, PostgREST and GoTrue stay up), `supabase test db`, then pnpm and Node as in `check`, `pnpm install --frozen-lockfile`, `pnpm db:types` followed by `git diff --exit-code` on `packages/data/src/database.types.ts` (fail on difference; the script formats the generator's output with the repository's Prettier, so only a real schema difference fails), and `pnpm --filter @gog/data test` with `GOG_TEST_SUPABASE_URL` and `GOG_TEST_SUPABASE_ANON_KEY` taken from `supabase status -o env`, so the Supabase repositories run their contract suites against the real PostgREST and GoTrue (they skip everywhere else). CLI version pinned in CI and README; upgrade local and CI together. `supabase gen types typescript --local --schema public` parses in 2.116 (the language is positional and optional; `--lang` defaults to typescript); `supabase test db` runs pg_prove in a container, so the Docker-less path keeps using local `pg_prove` as `03-database.md` specifies.

Turborepo remote cache is not configured in this iteration.

## Definition of done for iteration 1

Run from a clean clone on this machine (Node 22, pnpm 10, Supabase CLI, Homebrew Postgres 17, no Docker):

1. `pnpm install --frozen-lockfile` completes without errors or build-script warnings. Build-script approvals for native dependencies are committed (`onlyBuiltDependencies` in `pnpm-workspace.yaml`).
2. `pnpm check` passes: every package lints, typechecks and its tests pass. Domain has tests for every function in `02-domain-model.md`; data has mapper, error-mapping and contract tests for both implementations. The Supabase contract suites need a seeded stack: set `GOG_TEST_SUPABASE_URL` and `GOG_TEST_SUPABASE_ANON_KEY` (from `supabase status -o env`; optional `GOG_TEST_SUPABASE_PHONE`, default `+919999900001`, and `GOG_TEST_SUPABASE_OTP`, default `123456`, matching `[auth.sms.test_otp]`), otherwise they skip with the reason in the suite name. The booking suite holds Pixel Den Standard PC seats one week ahead at 12:00, 14:00, 16:00 and 20:00 IST and cancels them afterwards, so the stack should be quiet.
3. `GOG_DATA_SOURCE=fixtures pnpm --filter @gog/web build` succeeds and `pnpm --filter @gog/web start` serves `/`, `/cafes`, `/cafes/pixel-den-koramangala`, `/areas/koramangala`, `/events`, `/download`, `/for-cafes`, `/sitemap.xml`, `/robots.txt` with status 200.
4. `pnpm --filter @gog/player typecheck`, `lint`, `test` and `run doctor` pass (`pnpm doctor` without `run` is pnpm's own command) and `npx expo export --platform ios` succeeds inside `apps/player`.
5. `pnpm db:local:up && pnpm db:local:reset` applies the shim, all migrations and the seed to the local Postgres; `pnpm db:local:types` regenerates `database.types.ts` with no diff (without Docker it runs the root devDependency `@supabase/postgres-meta`, the generator the CLI pins, see `03-database.md`); `pnpm db:local:test` passes when the `pgtap` extension is installed (there is no Homebrew formula; build it from source or use `pnpm db:test` with Docker), otherwise reports it is skipped.
6. `pnpm format:check` passes.
7. README explains setup in under five minutes of reading, including the Docker-less path and how to point at a real Supabase project.
8. Nothing in `apps/web` imports booking or auth modules, including through the `@gog/data` root barrel or the two booking/auth creators of `@gog/data/factory`; nothing in `@gog/domain` imports React, Next, React Native or Supabase (lint proves both).
