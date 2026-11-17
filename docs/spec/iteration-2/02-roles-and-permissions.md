# 02. Roles and permissions

## The five roles

- **Anonymous**: no session. The website, and the player app before sign-in.
- **Player**: any signed-in account, for any cafe where it has no role. Everyone who signs in to either app is a player first; one account can be a player at one cafe and staff at another.
- **Staff**: a `cafe_members` row with `role = 'staff'` for that cafe. Runs the counter.
- **Owner**: a `cafe_members` row with `role = 'owner'` for that cafe. Everything staff can do, plus the listing, prices, pledged stations, hours, closures, the team, the partner terms, and hiding the cafe.
- **Operator**: the caller's phone number is in `platform_operators` (ADR 0014). Owner powers at every cafe, plus a few of its own, minus two things only the cafe's people may do: accept the partner terms and acknowledge bookings.

How a role is found: `cafe_role(cafe_id)` returns `'operator'` when `is_platform_operator()` is true and the cafe exists, otherwise the caller's `cafe_members.role` for that cafe, otherwise `null`. Both count only a session opened with an SMS code (the access token's `amr` says `otp`), and an operator's account must also have a confirmed phone. A session opened any other way, such as with a password someone registered for the number before its holder first signed in, is a player with no partner role anywhere (ADR 0014). Every partner function starts with `require_cafe_role(cafe_id, allowed)`, which raises:

- `GG001` when there is no signed-in user;
- `GG007` when the caller has no role at the cafe or the cafe does not exist (the two are indistinguishable, so a stranger learns nothing about drafts);
- `GG010` when the caller has a role there but not one of `allowed`.

Grants decide who can call a function at all: every partner function is granted to `authenticated` only, so an anonymous call fails with `42501` before the body runs, as `create_booking` does today.

Membership is checked live on every call. Removing someone, or deleting an operator row, takes effect on their next request; nobody waits for the one-hour access token to expire.

## Matrix

"Own" means the caller's own bookings or own invitations. The last column names the function, view or policy that enforces the rule (`03-database.md`).

### Public and player

| Action                                                                                         | Anonymous | Player | Staff | Owner | Operator | Enforced by                                                                                          |
| ---------------------------------------------------------------------------------------------- | --------- | ------ | ----- | ----- | -------- | ---------------------------------------------------------------------------------------------------- |
| Read the public catalog (live cafes, tiers, active stations, hours, images, games, promotions) | yes       | yes    | yes   | yes   | yes      | The iteration-1 select policies, unchanged (ADR 0015)                                                |
| Read free seats                                                                                | yes       | yes    | yes   | yes   | yes      | `get_availability`, granted to `anon` and `authenticated`                                            |
| Hold and confirm seats                                                                         | no        | own    | own   | own   | own      | `create_booking`, `confirm_booking`: the caller is the booker                                        |
| Cancel a booking as the booker, until its start                                                | no        | own    | own   | own   | own      | `cancel_booking`: the booker only, and `GG008` from the start or after check-in, from M1             |
| List my bookings                                                                               | no        | own    | own   | own   | own      | `my_booking_details`: `user_id = auth.uid()`, plus the bookings policy, which is booker-only from M0 |
| Delete my account (M7)                                                                         | no        | own    | own   | own   | own      | `delete_my_account`; the last owner of a cafe gets `GG013`                                           |
| Sign in by phone and code                                                                      | yes       | yes    | yes   | yes   | yes      | Supabase Auth; signing in for the first time creates the account                                     |

Staff, owners and operators book as players. Their own bookings appear in their own "My bookings" (and, like anyone's, on the board of the cafe they booked); their cafe's other bookings never appear in their "My bookings", and from M0 they cannot read them from `bookings` either.

### Joining and reading a cafe

| Action                                                        | Anonymous | Player       | Staff     | Owner     | Operator  | Enforced by                                                                                                                      |
| ------------------------------------------------------------- | --------- | ------------ | --------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Accept invitations sent to my number                          | no        | own          | own       | own       | own       | `accept_cafe_invites`: the invite's phone equals the caller's confirmed `auth.users.phone`, in a session opened with an SMS code |
| List my cafes                                                 | no        | none         | own cafes | own cafes | all cafes | `partner_cafes`                                                                                                                  |
| Read a cafe as its partners see it (any status, all stations) | no        | no (`GG007`) | yes       | yes       | yes       | `partner_cafe`                                                                                                                   |
| Know whether I am an operator                                 | no        | yes          | yes       | yes       | yes       | `is_platform_operator` (answers for the caller only)                                                                             |

### Listing

| Action                                                                             | Anonymous | Player | Staff        | Owner | Operator | Enforced by                                                                              |
| ---------------------------------------------------------------------------------- | --------- | ------ | ------------ | ----- | -------- | ---------------------------------------------------------------------------------------- |
| Create a draft cafe                                                                | no        | no     | no           | no    | yes      | `operator_create_cafe`                                                                   |
| Change the slug, until the cafe is first published                                 | no        | no     | no           | no    | yes      | `operator_set_cafe_slug`; frozen afterwards (`GG008`)                                    |
| Edit name, area, address, map position, description, amenities, WhatsApp, map link | no        | no     | no (`GG010`) | yes   | yes      | `update_cafe_details`                                                                    |
| Create, edit or delete a tier, including its hourly rate                           | no        | no     | no (`GG010`) | yes   | yes      | `save_station_tier`, `delete_station_tier`                                               |
| Add, relabel or delete stations; pledge a station to the app                       | no        | no     | no (`GG010`) | yes   | yes      | `add_stations`, `update_station`, `delete_station`                                       |
| Take a station out of service, or back                                             | no        | no     | yes          | yes   | yes      | `set_station_active` (M4)                                                                |
| Replace the weekly hours                                                           | no        | no     | no (`GG010`) | yes   | yes      | `set_cafe_hours`                                                                         |
| Choose the cafe's games                                                            | no        | no     | no (`GG010`) | yes   | yes      | `set_cafe_games`                                                                         |
| Upload, reorder or remove photos (M6)                                              | no        | no     | no           | no    | yes      | `storage.objects` policies; `add_cafe_image`, `reorder_cafe_images`, `remove_cafe_image` |

### Team

| Action                                  | Anonymous | Player | Staff           | Owner                                         | Operator | Enforced by                                                                                                      |
| --------------------------------------- | --------- | ------ | --------------- | --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| See the members and pending invitations | no        | no     | no (`GG010`)    | yes                                           | yes      | `partner_cafe_members`, `partner_cafe_invites`                                                                   |
| Invite a number as owner or staff       | no        | no     | no (`GG010`)    | yes                                           | yes      | `invite_cafe_member`                                                                                             |
| Revoke a pending invitation             | no        | no     | no (`GG010`)    | yes                                           | yes      | `revoke_cafe_invite`                                                                                             |
| Change a member's role                  | no        | no     | no (`GG010`)    | staff, or themselves (another owner: `GG010`) | yes      | `set_cafe_member_role`; never leaves the cafe without an owner (`GG013`, checked under a lock on the owner rows) |
| Remove a member                         | no        | no     | only themselves | staff, or themselves (another owner: `GG010`) | yes      | `remove_cafe_member`; never the last owner (`GG013`, under the same lock)                                        |

Only an operator removes or demotes an owner other than the caller. An owner signed in on a shared counter PC stays signed in, so otherwise anyone at that PC could invite their own number as owner, accept it on their own phone and remove the real owner; owners still invite owners and manage staff.

### Publishing and app bookings

| Action                                             | Anonymous | Player | Staff        | Owner                                | Operator     | Enforced by                                                                                                            |
| -------------------------------------------------- | --------- | ------ | ------------ | ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Approve the listing and accept the partner terms   | no        | no     | no (`GG010`) | yes                                  | no (`GG010`) | `accept_partner_terms`                                                                                                 |
| Publish a draft (draft to live)                    | no        | no     | no (`GG010`) | no (`GG010`)                         | yes          | `set_cafe_status`, with the publish gate (`GG014`)                                                                     |
| Hide a listed cafe (live to paused)                | no        | no     | no (`GG010`) | yes                                  | yes          | `set_cafe_status`                                                                                                      |
| List a hidden cafe again (paused to live)          | no        | no     | no (`GG010`) | yes, unless an operator suspended it | yes          | `set_cafe_status`, with the publish gate (`not_suspended` among its items)                                             |
| Switch app bookings off                            | no        | no     | yes          | yes                                  | yes          | `set_app_bookings` (M4)                                                                                                |
| Switch app bookings on                             | no        | no     | no (`GG010`) | once an operator has approved        | yes          | `set_app_bookings`, with its gate (`GG014`: `listed`, `pledged_station`, `not_suspended`, and `approved` for an owner) |
| Set the notice period and the no-show grace period | no        | no     | no (`GG010`) | yes                                  | yes          | `set_app_booking_rules` (M4)                                                                                           |
| Add or remove a closure                            | no        | no     | no (`GG010`) | yes                                  | yes          | `add_cafe_closure`, `remove_cafe_closure` (M4)                                                                         |

### Counter

| Action                                                                  | Anonymous | Player | Staff | Owner | Operator     | Enforced by                                                                                    |
| ----------------------------------------------------------------------- | --------- | ------ | ----- | ----- | ------------ | ---------------------------------------------------------------------------------------------- |
| See the board: the cafe's bookings and blocks, up to eight days at once | no        | no     | yes   | yes   | yes          | `partner_bookings` (M3)                                                                        |
| Acknowledge new app bookings                                            | no        | no     | yes   | yes   | no (`GG010`) | `acknowledge_bookings` (M3)                                                                    |
| Create, extend, end or cancel a counter block                           | no        | no     | yes   | yes   | yes          | `create_counter_block`, `extend_counter_block`, `complete_booking`, `cafe_cancel_booking` (M4) |
| Check in, mark a no-show, complete, move a seat                         | no        | no     | yes   | yes   | yes          | `check_in_booking`, `mark_no_show`, `complete_booking`, `move_booking_seat` (M5)               |
| Cancel an app booking as the cafe, with a reason                        | no        | no     | yes   | yes   | yes          | `cafe_cancel_booking` (M4)                                                                     |

### Operator only

| Action                                                                                                                        | Enforced by                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| List unacknowledged app bookings at every cafe                                                                                | `operator_unacknowledged_bookings` (M3)                                                                         |
| List the cafes' cancellations of upcoming app bookings, with their reasons                                                    | `operator_cafe_cancellations` (M4)                                                                              |
| Look up the phone number behind one app booking, until 24 hours after it ends                                                 | `operator_booker_phone` (M3); every lookup is written to `partner_audit_log` (ADR 0017)                         |
| Approve app bookings at a cafe once its counter has passed a test booking, or withdraw the approval (which switches them off) | `operator_approve_app_bookings` (M4; `GG014` naming `counter_test` without a completed, checked-in app booking) |
| Suspend a cafe (hidden, app bookings off, nobody may list it or switch them on), or lift the suspension                       | `operator_suspend_cafe` (M4)                                                                                    |
| Remove or demote an owner other than themselves                                                                               | `remove_cafe_member`, `set_cafe_member_role` (M2)                                                               |

## What no app can do

- Add or remove an operator. That is one SQL statement run by hand in the Supabase SQL editor or with `psql` (ADR 0014).
- Write any table or view directly. Table-level `insert`, `update`, `delete`, `truncate`, `references` and `trigger` are revoked from `anon` and `authenticated` on everything in `public`; the one column grant left is iteration 1's `profiles (display_name, home_city_id)`, which no partner screen uses.
- Read `platform_operators`, `cafe_invites`, `partner_terms_acceptances`, `cafe_closures` or `partner_audit_log` directly. They have RLS on and no policy; the partner functions read them on the caller's behalf.
- Create areas, games or promotions, or change a city's `is_live`. These stay Supabase dashboard tasks for the founder, as in iteration 1.
- See a player's name, phone number or user id as a cafe (ADR 0017). The partner shapes carry none of them, and from M0 the bookings policy shows a member only their own bookings.
- Act for a cafe, or as an operator, from a session that was not opened with an SMS code (ADR 0014).

## How the apps use this

The partner app hides what the caller's role cannot do: it reads the role from `partner_cafes` and `partner_cafe` and decides buttons with `@gog/domain` helpers (`04-packages.md`). That is convenience only. The database is the boundary (ADR 0011): a hidden button that a modified client calls anyway gets `GG010` or `GG007`.
