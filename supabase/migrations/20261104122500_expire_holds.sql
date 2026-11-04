-- expire_holds() returns integer
-- (docs/spec/03-database.md, Functions; ADR 0005.)
--
-- Contract: moves every held booking whose hold has lapsed (hold_expires_at <= now()) to
-- `expired` and releases its unreleased seats, in one data-modifying CTE so seats are released
-- only for rows this statement actually moved (never the seats of a booking confirmed in
-- between). Returns the number of bookings expired. pg_cron calls it every minute as a sweeper;
-- correctness never depends on it because create_booking expires lapsed holds of the tier it is
-- about to allocate. (`<=` wherever a hold lapses; confirm_booking requires hold_expires_at > now().)
-- Security definer; granted to nobody but the owner (service_role keeps its default grant).
-- Errors: none.
create function public.expire_holds()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count integer;
begin
  with lapsed as (
    update public.bookings
    set status = 'expired'
    where status = 'held'
      and hold_expires_at <= now()
    returning id
  ),
  released as (
    update public.booking_seats
    set released_at = now()
    where released_at is null
      and booking_id in (select id from lapsed)
    returning id
  )
  select count(*)::integer into v_count from lapsed;

  return v_count;
end;
$$;

revoke execute on function public.expire_holds() from public, anon, authenticated;
