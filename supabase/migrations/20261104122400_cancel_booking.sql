-- cancel_booking(p_booking_id uuid) returns booking_details
-- (docs/spec/03-database.md, Functions; ADR 0005.)
--
-- Contract: the booking's owner, or a cafe_members row for its cafe, cancels a held or confirmed
-- booking: status = cancelled and released_at = now() on its unreleased seats, which frees the
-- stations for the exclusion constraint. Rows are never deleted. Race-safe: the row is locked
-- with `for update` before the state check. Security definer; granted to authenticated only.
--
-- Errors (SQLSTATE):
--   GG001  auth.uid() is null
--   GG007  no such booking, or the caller is neither its user nor a member of its cafe
--   GG008  status is not held or confirmed
create function public.cancel_booking(p_booking_id uuid)
returns public.booking_details
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_result public.booking_details;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = 'GG001';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'booking not found' using errcode = 'GG007';
  end if;

  if v_booking.user_id <> v_user_id
     and not exists (
       select 1
       from public.cafe_members m
       where m.cafe_id = v_booking.cafe_id
         and m.user_id = v_user_id
     ) then
    raise exception 'booking not found' using errcode = 'GG007';
  end if;

  if v_booking.status not in ('held', 'confirmed') then
    raise exception 'booking cannot be cancelled from its current state' using errcode = 'GG008';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.booking_seats
  set released_at = now()
  where booking_id = p_booking_id
    and released_at is null;

  select * into strict v_result from public.booking_details where id = p_booking_id;
  return v_result;
end;
$$;

revoke execute on function public.cancel_booking(uuid) from public, anon, authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
