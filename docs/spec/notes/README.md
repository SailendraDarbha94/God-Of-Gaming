# Builder notes

Iteration 1 is built one part at a time, each builder writing only inside its own directories (`apps/web`, `apps/player`, `packages/domain`, `packages/data`, `supabase/`, the repository root). Anything a builder needs outside its own directories is a cross-cutting request, and it goes here instead of being applied: a root file (`package.json`, `turbo.json`, `.gitignore`, `.npmrc`, `pnpm-workspace.yaml`, `README.md`), another package's code or `package.json`, a shared config in `packages/tsconfig` or `packages/eslint-config`, or a spec amendment.

## How to leave a note

- One file per builder, named after the part: `web.md`, `player.md`, `domain.md`, `data.md`, `db.md`, `repo.md`. Append to your file; do not edit another builder's.
- One bullet per request, with four parts: **where** (file and, where it helps, the key or line), **what** (the exact change, as a diff or the full new value), **why** (what breaks or drifts without it), **evidence** (the command you ran, the documentation page, or the spec section). A request without evidence is an opinion; the integration step may skip it.
- Keep it to what you needed. Observations about another part that do not block yours go in your pull request description or `docs/spec/DEVIATIONS.md`, not here.
- Do not pre-empt the change elsewhere with a local workaround unless your part cannot pass its own `lint`, `typecheck` and `test` without one; if you must, say so in the note so the workaround is removed when the request is applied.

## What happens next

The integration step reads every file in this folder, applies the requests that hold up (or records why not, in `docs/spec/CHANGELOG.md`), and then deletes the applied notes. A note that is still here after integration is either open or rejected, and the changelog says which. Nothing in this folder is specification; `docs/spec/*.md` and `docs/adr/*.md` remain the only sources of truth.
