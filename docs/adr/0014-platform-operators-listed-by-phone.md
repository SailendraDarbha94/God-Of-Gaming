# 0014. Platform operators are listed by phone in the database

Date: 2026-11-16
Status: Proposed

## Context

The founder signs cafes on in person. During a visit the founder creates the draft listing, invites the owner, checks the preview with them and publishes it. Afterwards the founder watches for bookings that no cafe has seen. Nothing in iteration 1 represents this person: `cafe_member_role` is `owner | staff` and is scoped to one cafe, and there is no operator or admin role anywhere in the migrations, `@gog/domain` or `@gog/data`. Content is edited in the Supabase dashboard today (spec 01).

The service-role key never reaches an app (ADR 0011, enforced by `assertPublishableKey` in both client factories), so operator powers have to be checked in SQL against the caller's identity. The options were:

1. A table keyed by user id. Revocation is immediate, but a row can be added only after the person has signed in once, and the contract suites in CI would need an extra step to look the id up.
2. A table keyed by phone number, matched against `auth.users.phone` on every call. Revocation is immediate, and the shim's `auth.users` already has `phone` (`supabase/local/shim.sql`).
3. An `app_metadata` claim set in the Supabase dashboard. No table is needed, but a removed operator keeps the claim until the access token expires (`jwt_expiry = 3600` in `supabase/config.toml`).
4. A custom access token hook. It adds configuration that must exist on every hosted project as well as locally.
5. Keep using the dashboard. That does not serve a visit, where the founder works from a phone.

The repository is public, and CI scans every push for secrets. A real phone number must never be committed, and a hosted project must never receive an operator row from a file in git.

## Decision

- A new table `platform_operators (phone text primary key, created_at)` holds the operators' numbers in GoTrue's digits-only form (`919…`), with a check on that form. RLS is on with no policy, and table writes are revoked, so no app can read or change it.
- `is_platform_operator()` (security definer, `stable`) returns whether the caller's `auth.users.phone` is in the table, the phone is confirmed, and the caller's session was opened with an SMS code (the access token's `amr` claim says `otp`). Every operator check calls it, so adding or deleting a row takes effect on the caller's next request.
- Operator is a platform role, not a value of `cafe_member_role`. An operator acts on every cafe with an owner's powers, plus a few powers of their own: creating a draft cafe, changing a slug before the first publish, publishing, approving a cafe for app bookings once its counter has passed a test booking (and withdrawing that approval), suspending a cafe, removing or demoting an owner, uploading photos (if milestone M6 is built), seeing unacknowledged bookings and the cafes' cancellations across cafes, and looking up the phone number behind one live booking (ADR 0017). An operator cannot accept partner terms for a cafe and cannot acknowledge a cafe's bookings: both must be done by the cafe's own people.
- Rows are added and removed by hand with one SQL statement. On a hosted project that is the Supabase SQL editor, run only after the operator has signed in there by SMS and their `auth.users` row has been checked (`docs/spec/iteration-2/07-launch.md`); in CI and on a local Docker stack it is one `psql` statement for the test operator's number. No migration, seed file or other file a hosted project applies contains an operator row, and the founder's own number never enters git.
- Phone OTP is the only factor for operators, as for everyone (ADR 0011). Matching by phone alone would not be enough, because whoever holds an account with that number would pass, and GoTrue lets someone who does not hold the SIM hold it. A phone-and-password sign-up is a documented path, and the documentation offers no switch for it ([passwords](https://supabase.com/docs/guides/auth/passwords), read by the review on 16 Nov 2026); when the number's real holder later signs in by code, GoTrue confirms that existing account and keeps the password the first person chose, so both can sign in to it (`supabase/auth` master: `internal/api/signup.go` leaves an existing unconfirmed user unchanged, and `ConfirmPhone` in `internal/models/user.go` touches only `confirmation_token` and `phone_confirmed_at`; read 16 Nov 2026). With phone confirmations off, a sign-up even returns a session without any code. A password on the account proves nothing, because GoTrue gives every code sign-up a random 64-character temporary password (`internal/api/otp.go`). So the checks look at the session instead: `is_platform_operator()`, every cafe role (`cafe_role`), `partner_cafes` and `accept_cafe_invites` count only a session whose `amr` says `otp`, which GoTrue records when a phone code is verified and repeats in every refreshed token (`internal/api/verify.go`, `internal/models/sessions.go`), on an account whose `phone_confirmed_at` is set. A password session on the same account is a player with no partner role. Every hosted project has phone confirmations switched on in its dashboard: today only `supabase/config.toml` sets them, for local stacks, and that file is never pushed.

## Consequences

- Revoking an operator is a `delete` that applies at once, with no token to wait out.
- The check is plain SQL, so pgTAP covers it on the shim and on the real stack alike.
- A mobile number that lapses and is reissued gives its new holder the founder's account. That is true of every phone-OTP account. The founder keeps the number active; app-based MFA for operators is a later option.
- Someone who registers a number with a password before its holder's first sign-in still shares that account as a player: they can see and cancel its own bookings, but get no partner or operator power. Clearing such passwords needs an Auth hook or a trigger on `auth.users`, a later option. Meanwhile the founder checks an operator's `auth.users` row before inserting the operator row: a row created before the operator's own first sign-in is deleted, and the operator signs in again. This matters for the founder's number in particular, because it will be public as the support WhatsApp.
- Tests must state the sign-in method: pgTAP claims carry `amr`, and the Supabase contract suites prove that GoTrue's tokens have the shape the check reads. Fixture sessions are always code sign-ins.
- A second operator is one more row.
- Changing to claims or a hook later is a new record, and the functions keep calling `is_platform_operator()` and `is_otp_session()`, so only those functions change.
