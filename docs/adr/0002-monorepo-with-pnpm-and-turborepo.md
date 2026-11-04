# 0002. Monorepo with pnpm workspaces and Turborepo

Date: 2026-11-04
Status: Accepted

## Context

The product has a React Native app, a Next.js website and shared domain rules and data access. One person maintains all of it today. Shared code must stay in lockstep with both apps, and the two apps must agree on one React version (React Native 0.88 requires React 19.3; Next 16 accepts it).

## Decision

- One repository, pnpm workspaces, Turborepo 2 for task running and caching. Layout: `apps/*` for deployable applications, `packages/*` for shared libraries, `supabase/` for the database project, `docs/` for ADRs and specs.
- Internal packages are consumed as TypeScript source (Turborepo's "just-in-time" packages). They have no build step; `exports` points at `src/`. Next.js transpiles them through `transpilePackages`; Metro reads TypeScript natively.
- Versions of dependencies that appear in more than one package (React, TypeScript, Zod, supabase-js, ESLint, Vitest, and so on) are pinned once in the pnpm catalog in `pnpm-workspace.yaml` and referenced as `catalog:`. Exact versions, no ranges.
- `node-linker=hoisted` in `.npmrc`, because React Native tooling (Metro, autolinking, Gradle and CocoaPods scripts) expects a flat `node_modules`. This is re-verified against the Expo monorepo guide at every SDK upgrade and dropped as soon as it is unnecessary.
- The root `package.json` holds only tooling; all application dependencies live in the package that imports them.

## Consequences

- One lockfile, one install, one React version. A dependency bump is one line in the catalog.
- Hoisting removes pnpm's protection against undeclared (phantom) dependencies. Every package declares what it imports, and CI installs with `--frozen-lockfile`.
- No `dist/` for packages means no stale build output, but type errors in a package surface in the consumer's typecheck; `pnpm typecheck` runs per package so they are found at the source.
