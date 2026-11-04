# Specification: iteration 1, foundations

This folder is the target for the first iteration of the codebase. It is written for whoever implements a part of it (a person or an agent) and for whoever reviews the result. The ADRs in `../adr/` explain why; these documents say what.

| File                                                                 | Covers                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01-product-scope.md](01-product-scope.md)                           | What we are building, founder decisions, what iteration 1 includes and excludes |
| [02-domain-model.md](02-domain-model.md)                             | Entities, invariants and the pure functions in `@gog/domain`                    |
| [03-database.md](03-database.md)                                     | Postgres schema, functions, policies, cron, seed, tests, local shim             |
| [04-packages.md](04-packages.md)                                     | Workspace layout, shared packages and their public APIs                         |
| [05-web.md](05-web.md)                                               | The showcase website (`apps/web`)                                               |
| [06-player-app.md](06-player-app.md)                                 | The player app (`apps/player`)                                                  |
| [07-standards-and-verification.md](07-standards-and-verification.md) | Coding standards, tooling, CI and the definition of done                        |
| [08-sample-data.md](08-sample-data.md)                               | The sample dataset encoded by both the fixtures and the seed                    |

Rules for implementers:

- Build what is written here and nothing more. If something is missing or wrong, implement the smallest sensible interpretation and record the deviation in your pull request description (or in `docs/spec/DEVIATIONS.md` when working without a PR).
- Pinned versions live in `pnpm-workspace.yaml` (the pnpm catalog). Do not pin a different version in a package.
- Current documentation beats memory. Next.js 16, Expo SDK 58, Tailwind CSS 4 and Supabase have all changed recently; check their docs for any API you are not certain about.
- Names: the product's working title is "God of Gaming". It appears only in `apps/web/src/config/site.ts`, `apps/player/app.config.ts` and copy, so that renaming is a search-and-replace. The package scope is `@gog`.
