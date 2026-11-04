# Contributing

## Principles

1. The database protects the data; clients are untrusted. Booking rules live in SQL functions and constraints (ADR 0005, 0011).
2. Pure before impure. Rules in `@gog/domain`, I/O in `@gog/data`, composition in the apps.
3. Validate at the edges, trust the inside. Zod at environment, network and user-input boundaries.
4. Share schemas and data access, not UI (ADR 0007).
5. One version of each shared dependency, pinned in the pnpm catalog (ADR 0002).
6. Decisions that are expensive to reverse get an ADR before the code.

The full list, with tooling and the definition of done, is in `docs/spec/07-standards-and-verification.md`.

## Workflow

- Branch from `main`, keep the change small, open a pull request early.
- Conventional Commits: `feat(web): add area pages`, `fix(db): release seats on cancel`, `db(migration): add promotions`, `docs(adr): 0013 partner surface`. Scopes are package names plus `db`, `ci`, `docs`.
- `pnpm check` locally before pushing; CI runs the same plus the website build against fixtures, `expo-doctor`, the migrations with their pgTAP tests, and a diff of the generated database types.
- Editor: open the repository root in VS Code and accept the recommended extensions (`.vscode/extensions.json`); Prettier formats on save and ESLint runs per package.
- Migrations are never edited after merge; add a new one.
- Generated files (`packages/data/src/database.types.ts`) are regenerated, never hand-edited; CI fails if they are stale.

## Pull request checklist

- [ ] Links the spec section or ADR it implements.
- [ ] Tests for new rules (Vitest) and for new SQL (pgTAP).
- [ ] No new dependency without a one-line reason in the description.
- [ ] `.env.example` updated if a variable was added.
- [ ] Copy uses "Bengaluru"; amounts are paise; instants are UTC.
