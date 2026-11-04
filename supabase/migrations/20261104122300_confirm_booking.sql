-- confirm_booking(p_booking_id uuid) returns booking_details
-- (docs/spec/03-database.md, Functions; ADR 0005.)
--
-- Contract: the booking's owner turns a live hold into a confirmed booking: status = confirmed,
-- hold_expires_at = null. Later this is gated by payment. Race-safe by construction: the row is
-- locked with `for update` before the state check, so a concurrent expiry or cancel waits and
-- then fails its own state check (or this call sees the moved row and raises GG008).
-- Security definer; granted to authenticated only.
--
-- Errors (SQLSTATE):
--   GG001  auth.uid() is null
--   GG007  no such booking, or it does not belong to the caller
--   GG008  status is not held, or the hold has lapsed (hold_expires_at <= now())
create function public.confirm_booking(p_booking_id uuid)
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
  if not found or v_booking.user_id <> v_user_id then
    raise exception 'booking not found' using errcode = 'GG007';
  end if;

  if v_booking.status <> 'held'
     or v_booking.hold_expires_at is null
     or v_booking.hold_expires_at <= now() then
    raise exception 'booking is not a live hold' using errcode = 'GG008';
  end if;

  update public.bookings
  set status = 'confirmed',
      hold_expires_at = null
  where id = p_booking_id;

  select * into strict v_result from public.booking_details where id = p_booking_id;
  return v_result;
end;
$$;

revoke execute on function public.confirm_booking(uuid) from public, anon, authenticated;
grant execute on function public.confirm_booking(uuid) to authenticated;
