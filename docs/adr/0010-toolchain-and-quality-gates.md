# 0010. Toolchain and quality gates

Date: 2026-11-04
Status: Accepted

## Context

The founder asked for good programming principles from the first commit. For a one-person team that means tooling that catches mistakes automatically, with as few moving parts as possible, and a CI gate that is the same for every change.

## Decision

- TypeScript 6.0 (the last JavaScript-based release, April 2026, and the version Expo's SDK 58 template pins) in strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` and `isolatedModules`. Not TypeScript 7.0 (the Go-based compiler) yet: typescript-eslint supports `< 6.1` and the Next.js and Expo toolchains have not declared support. Revisit in the first quarter of 2027.
- ESLint 10 flat config (ESLint 9.x reached end-of-life on 2026-08-06; every config we use declares ESLint 10 support) with type-aware `typescript-eslint` rules, plus `eslint-config-next` and `eslint-config-expo` where they apply, and `eslint-config-prettier` last. Prettier formats everything. Shared configs live in `@gog/eslint-config` and `@gog/tsconfig`.
- Vitest for unit tests in packages and the web app. SQL is tested with pgTAP through `supabase test db`. The player app is covered by typecheck and lint in this iteration; component tests come with the first non-trivial screen logic.
- CI on GitHub Actions is the gate: install with a frozen lockfile, then lint, typecheck, test, build the website, apply migrations to a fresh database and run pgTAP, and fail if the committed generated database types are stale.
- No git hooks. The local loop stays fast; `pnpm check` runs what CI runs.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `db:` for migrations), small pull requests, `main` always deployable.
- Node 22 LTS, pnpm 10 pinned through `packageManager`.

## Consequences

- A contributor needs Node, pnpm and (for database work) Docker or a local Postgres; nothing else is installed globally.
- Type-aware linting is slower than syntax-only linting; Turborepo caches it per package so only changed packages pay.
