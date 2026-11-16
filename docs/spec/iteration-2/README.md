# Specification: iteration 2, the partner dashboard

Iteration 2 gives cafes a partner dashboard, `apps/partner`, and gives the founder what is needed to sign Bengaluru cafes on in person while keeping the app's availability true at the counter. The founder chose the form on 16 November 2026: a Next.js web app, with an Expo partner app possibly later (ADR 0013). The ADRs in `../../adr/` (0013 to 0017 for this iteration) explain why; these documents say what.

| File                                                       | Covers                                                                                                    |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [01-scope.md](01-scope.md)                                 | Goal, users, what is in and out, milestones with acceptance checks, open decisions, founder prerequisites |
| [02-roles-and-permissions.md](02-roles-and-permissions.md) | Operator, owner, staff, player and anonymous: every action and how it is enforced                         |
| [03-database.md](03-database.md)                           | New and changed tables, functions with contracts, error codes, policies, grants, cron, seed, pgTAP        |
| [04-packages.md](04-packages.md)                           | `@gog/domain` and `@gog/data` additions, fixtures, contract suites, ESLint boundaries, tooling            |
| [05-partner-app.md](05-partner-app.md)                     | `apps/partner`: routes, screens, data access, sign-in, environment, layout, accessibility                 |
| [06-verification.md](06-verification.md)                   | Definition of done, tests per layer, CI changes, what can only be checked by hand                         |
| [07-launch.md](07-launch.md)                               | Going live in Bengaluru: accounts, costs, hosting, SMS, the onboarding visit, and the order of it all     |
| [08-sample-data.md](08-sample-data.md)                     | New rows for the seed and the fixtures: a draft cafe, personas, invites, pledges, sample board content    |
| [CHANGELOG.md](CHANGELOG.md)                               | Amendments to this plan after its review, with what was applied, rejected and left out, and why           |

## How these documents relate to `docs/spec/01` to `08`

The iteration-1 documents in `docs/spec/` are living specifications: they describe the system as it is. The documents in this folder describe changes. The pull request that changes the code also amends the living specification it affects, in the same pull request (for example, the migration that adds `cafe_invites` also updates `docs/spec/03-database.md`). Milestone M0 creates `docs/spec/09-partner-app.md` from `05-partner-app.md`, and from then on that file is the partner app's living specification. Once iteration 2 is merged, this folder is history, like `docs/spec/INTEGRATION.md`.

When this folder and the code disagree, the code wins, and the builder records the difference (below). When this folder and an accepted ADR disagree, the ADR wins until a new ADR changes it (ADR 0001).

## Rules for implementers

Carried over from `docs/spec/README.md`:

- Build what is written here and nothing more. If something is missing or wrong, implement the smallest sensible interpretation and record the deviation in your pull request description (or in `docs/spec/iteration-2/DEVIATIONS.md` when working without a pull request).
- Pinned versions live in `pnpm-workspace.yaml` (the pnpm catalog). Do not pin a different version in a package.
- Current documentation beats memory. Next.js 16, Supabase and Tailwind CSS 4 change often; check their documentation for any API you are not certain about. Next 16.4.5 ships its documentation in `node_modules/next/dist/docs/`.
- Names: the product's working title is "God of Gaming". It appears only in `apps/web/src/config/site.ts`, `apps/player/app.config.ts`, the new `apps/partner/src/config/site.ts`, and copy. The package scope is `@gog`.

New for this iteration:

- Work in parts that write only inside their own directories: the database (`supabase/`), `packages/domain`, `packages/data`, `apps/partner`, the changes to `apps/player` and `apps/web`, and the repository tooling (root files, `packages/eslint-config`, `packages/tsconfig`, `.github/`). A change another part needs is a note in `docs/spec/notes/` as iteration 1 did (`docs/spec/notes/README.md`), not an edit in someone else's directory.
- Milestones (01-scope.md) are the order in which work merges and is accepted. Within a milestone the parts can be built in parallel, because the interfaces between them (function signatures, row shapes, TypeScript interfaces) are fixed here.
- Every new SQL function follows iteration 1's rules: a header comment with its contract and error codes, `set search_path = public, extensions`, `security definer` only when it must be, `revoke execute … from public, anon, authenticated` immediately after `create function`, then the grant this folder states, and at least one pgTAP test (`docs/spec/07-standards-and-verification.md`).
- No app writes a table directly. Every write is a function call, except the photo uploads of milestone M6, which go to Storage under the policies in 03-database.md (ADR 0015).
- Mark every external fact you rely on with its source and the date you read it, as these documents do. Where a fact here is marked unverified, verify it before building on it, or build so that either answer works.
- Never commit a real person's phone number, an operator row for a hosted project, or a key. Phone numbers in the repository are test fixtures only: the `[auth.sms.test_otp]` personas in `supabase/config.toml` (`9199999000NN`, for which GoTrue sends no SMS) and the `9199998000NN` numbers that pgTAP and the contract suites use as invite targets, which nothing ever sends a message to. Staging's private test numbers and codes live in its dashboard only.
- Every partner or operator check in SQL counts only a session opened with an SMS code on a confirmed phone (`is_otp_session`, ADR 0014). Never key a decision on whether an account has a password: GoTrue gives every code sign-up a random one.
