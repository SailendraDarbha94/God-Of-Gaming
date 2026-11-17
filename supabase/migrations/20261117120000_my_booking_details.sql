-- my_booking_details, and the bookings select policy for the booker only (docs/spec/03-database.md,
-- Views and Row Level Security; ADR 0015, ADR 0017).
--
-- Iteration 1's policy let any member of a cafe read every booking at that cafe through PostgREST
-- with their own session, `user_id` included, which links one player's visits over time and across
-- cafes. "My bookings" (`listMine`) read `booking_details`, which that policy filters, so a member's
-- own list would have shown other players' bookings at their cafe. Both close here, before any
-- membership exists: the policy shows each user their own bookings only, and `listMine` reads this
-- view, which is filtered to the caller as well. Nothing needed the member branch: cafes read
-- bookings only through the partner functions, which return no player identity. `booking_seats`
-- follows through its policy's subquery on `bookings`, unchanged.

drop policy "bookings: owner or cafe member can read" on public.bookings;

create policy "bookings: the booker can read"
  on public.bookings
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Migration 20261104121400 described members as seeing their cafe's bookings, which is no longer
-- true. Its index on cafe_members (user_id) still serves that table's own policy.
comment on table public.cafe_members is
  'Owners and staff of a cafe. A membership shows no booking: the bookings policy is the booker''s own (ADR 0017). cancel_booking still accepts a member of the booking''s cafe.';

-- security_invoker: a direct read is filtered by the bookings and booking_seats policies as well as
-- by the where clause. A later `create or replace view` must repeat the `with` clause, because it
-- replaces the view's options with its own (pgTAP 001 checks every view in public).
create view public.my_booking_details
with (security_invoker = true)
as
select d.*
from public.booking_details d
where d.user_id = (select auth.uid());

comment on view public.my_booking_details is
  'The signed-in user''s rows of booking_details: what "My bookings" lists (listMine).';

-- Supabase's default privileges grant ALL on every new relation in public to anon and authenticated,
-- and RLS never applies to truncate (migration 20261104122800). `select` stays granted: the policies
-- and the filter apply.
revoke insert, update, delete, truncate, references, trigger
  on public.my_booking_details
  from anon, authenticated;
