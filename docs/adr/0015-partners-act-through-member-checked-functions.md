# 0015. Partners act through member-checked functions

Date: 2026-11-16
Status: Accepted

## Context

Every catalog policy shows only published content: live cafes and their tiers, hours, images and games, active stations of live cafes, published promotions. `@gog/data`'s catalog repository relies on those policies to mean "what an anonymous reader may see" (`packages/data/src/catalog/repository.ts`), and so does the player app, which reads the catalog as `authenticated` with the same client it books with (`apps/player/src/lib/repositories.ts`). An owner or staff member who also plays uses that same account.

So two things go wrong the moment the first `cafe_members` row exists:

1. A select policy that lets members read their own draft cafe, inactive stations or unpublished promotions would also show them in that person's player app, and no test would catch it, because the Supabase catalog suite runs only with the public client.
2. "My bookings" in the player app reads `booking_details` with no user filter (`packages/data/src/booking/supabase-booking.ts`), and the bookings policy returns every booking at a member's cafe, with the booker's `user_id` (`booking_details` selects `b.*`). A member would see other players' bookings, each with a Cancel button that `cancel_booking` honours for any member of the cafe, and could link one player's visits by that id through PostgREST with their own session.

The role column of `cafe_members` is never checked: owners and staff can do the same things. `cafe_members.user_id` must already exist in `auth.users`, and GoTrue creates a user only when someone requests an OTP, so a person who has never signed in cannot be added. Storage writes are authorised only by `storage.objects` policies, not by functions ([Supabase storage access control](https://supabase.com/docs/guides/storage/security/access-control), read 16 Nov 2026).

## Decision

- The catalog policies do not change. No select policy for members is added to any catalog table. Public reads keep meaning what an anonymous reader may see, for the website and the player app alike.
- Partners read through security-definer functions that check the caller's role at that cafe: `partner_cafes`, `partner_cafe`, `partner_bookings`, `partner_cafe_members`, `partner_cafe_invites`, and the operator reads of ADR 0014. They return shapes made for the partner surface, which carry no player identity (ADR 0017).
- Every partner write is a security-definer function. Table-level writes stay revoked for `anon` and `authenticated` on every table and view in `public`, including the new ones, and a schema-wide pgTAP assertion fails CI when a migration forgets the revoke.
- Roles are enforced in SQL by one helper, `require_cafe_role(cafe, allowed roles)`. An owner manages the listing, prices, pledged stations, hours, closures, the team, the partner terms and hiding the cafe. Staff run the counter: the board, counter blocks, check-in, no-shows, taking a station out of order and switching app bookings off. Operators have owner powers plus their own (ADR 0014). A role counts only in a session opened with an SMS code (ADR 0014). A caller with no role at the cafe gets `GG007` (not found or not permitted, so existence does not leak); a member whose role is too low gets the new `GG010`.
- People join a cafe by invitation to a phone number. An invite stores GoTrue's digits-only form, expires after 14 days, can be revoked, and is accepted by `accept_cafe_invites()`, which the partner app calls after every sign-in, whenever it starts with a stored session and before each read of "My cafes". That works for people who already have a player account, for new ones, and for someone who was already signed in when invited. Inviting a number again revokes its expired invite first. Owners invite owners and staff and manage staff, but only an operator removes or demotes another owner, so nobody at a counter PC where an owner is signed in can lock the real owner out. The last owner of a cafe cannot be removed or demoted, checked under a lock on the cafe's owner rows so that two concurrent changes cannot both pass.
- "My bookings" means the caller's own bookings, enforced in SQL by the view `my_booking_details`. The bookings select policy loses its member branch in M0, so a member reads the bookings of their cafe only through `partner_bookings`, whose shape carries no user id (ADR 0017), and never directly through PostgREST. `cancel_booking` is for the booker only, until the booking's start. A cafe cancels a booking through `cafe_cancel_booking`, which requires a reason.
- Every partner write records who did it, in `bookings`' actor columns or in `partner_audit_log`. No app reads the log in this iteration; the founder reads it with SQL.
- Photo uploads, if built in this iteration (milestone M6), are the one exception to "writes through functions": `storage.objects` policies let operators, and only operators, upload to and delete from the `cafe-images` bucket under a folder named after an existing cafe id. The folder check runs in a security-definer helper, `can_write_cafe_image`, because the policy runs as the caller and the cafes policy hides drafts from them; no select policy is added to `cafes` for it. The `cafe_images` row is still written by a function.

## Consequences

- The website and the player app see exactly what they saw before, whoever is signed in. A contract run of the catalog suite as a signed-in owner of a draft cafe proves it.
- More SQL to write and test than a few policies would be, but each function states its checks in one place and has its own pgTAP cases.
- The partner shapes are separate types from the public ones (`PartnerCafe` beside `Cafe`), so a field added for partners cannot appear on the public site by accident.
- The fixture implementations must emulate the role checks, the invites and the refusals, and the shared contract suites keep them in step with SQL (ADR 0012).
- A table created later, in a migration or in the dashboard, still receives Supabase's default grants and needs the revoke; the schema-wide assertion turns forgetting it into a red build.
