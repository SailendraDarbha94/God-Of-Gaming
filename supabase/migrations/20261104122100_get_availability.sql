-- get_availability(p_tier_id uuid, p_day date, p_duration_minutes int = 60, p_step_minutes int = 30)
--   returns table (starts_at timestamptz, free_seats int)
-- (docs/spec/03-database.md, Functions; ADR 0005: display only, create_booking is the final word.)
--
-- Contract: one row per candidate start in the tier's cafe opening window for the opening day
-- p_day (IST), stepping p_step_minutes while start + duration <= upper(window). free_seats is
-- the number of active stations of the tier with no unreleased seat overlapping
-- [start, start + duration). Seats of a held booking whose hold has lapsed are not counted as
-- taken: create_booking expires them before allocating, so they are free in practice.
-- Returns zero rows, never an error, when the tier does not exist, the cafe is not live, or the
-- cafe has no cafe_hours row for that weekday; so, although callable by anon, it reveals nothing
-- about draft or paused cafes. Example: Friday 22:00-02:00 overnight hours and
-- get_availability(tier, date '2026-11-20') yield starts up to Saturday 01:00 IST for 60 minutes.
-- Security definer because booking_seats is not readable by the public. Granted to anon and
-- authenticated.
-- Errors: GG002 when p_duration_minutes or p_step_minutes is not a positive number.
create function public.get_availability(
  p_tier_id uuid,
  p_day date,
  p_duration_minutes integer default 60,
  p_step_minutes integer default 30
)
returns table (starts_at timestamptz, free_seats integer)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_cafe_id uuid;
  v_window tstzrange;
  v_duration interval;
  v_step interval;
begin
  if coalesce(p_duration_minutes, 0) < 1 or coalesce(p_step_minutes, 0) < 1 then
    raise exception 'duration and step must be positive numbers of minutes' using errcode = 'GG002';
  end if;

  select t.cafe_id
  into v_cafe_id
  from public.station_tiers t
  join public.cafes c on c.id = t.cafe_id
  where t.id = p_tier_id
    and c.status = 'live';

  if not found then
    return;
  end if;

  v_window := public.cafe_open_window(v_cafe_id, p_day);
  if v_window is null then
    return;
  end if;

  v_duration := make_interval(mins => p_duration_minutes);
  v_step := make_interval(mins => p_step_minutes);

  return query
    select
      g.slot_start,
      (
        select count(*)::integer
        from public.stations s
        where s.tier_id = p_tier_id
          and s.is_active
          and not exists (
            select 1
            from public.booking_seats bs
            join public.bookings b on b.id = bs.booking_id
            where bs.station_id = s.id
              and bs.released_at is null
              and bs.during && tstzrange(g.slot_start, g.slot_start + v_duration, '[)')
              and not (b.status = 'held' and b.hold_expires_at <= now())
          )
      )
    from generate_series(lower(v_window), upper(v_window) - v_duration, v_step) as g (slot_start)
    order by g.slot_start;
end;
$$;

revoke execute on function public.get_availability(uuid, date, integer, integer) from public, anon, authenticated;
grant execute on function public.get_availability(uuid, date, integer, integer) to anon, authenticated;
