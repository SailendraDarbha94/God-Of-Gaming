-- create_booking(p_cafe_id uuid, p_tier_id uuid, p_starts_at timestamptz, p_duration_minutes int,
--                p_seat_count int) returns booking_details
-- (docs/spec/03-database.md, Functions; ADR 0005, 0009, 0011.)
--
-- Contract: validates the request, checks opening hours, caps the caller's live holds and upcoming
-- bookings, serialises allocation per tier with a transaction-scoped advisory lock, expires lapsed
-- holds of the tier, picks p_seat_count free active stations (lowest labels first) under a fresh
-- snapshot, inserts the booking as `held` with a ten-minute hold and one booking_seats row per
-- station, and returns the booking_details row. Names and the hourly rate are copied from the cafe,
-- tier and stations at hold time. total_paise = round(rate * minutes / 60) * seats in numeric (ties
-- away from zero), the same number the domain quote() computes.
-- Security definer (clients never write booking tables); granted to authenticated only, so an
-- anonymous call fails with 42501 before the body runs.
--
-- Errors (SQLSTATE):
--   GG001  auth.uid() is null
--   GG002  duration not a multiple of 30 in [30, 360]; seats not in [1, 10]; start not on a
--          30-minute boundary; start < now() + 5 minutes or > now() + 30 days (message says which)
--   GG006  cafe not live, or tier does not belong to the cafe
--   GG003  [start, end) is outside the cafe's opening hours
--   GG009  the caller already has 3 live holds, or 10 upcoming bookings (confirmed or live held)
--   GG004  fewer than p_seat_count free stations
--   GG005  exclusion constraint fired (seat conflict under concurrency); safe to retry once
--
-- Concurrency: two near-simultaneous holds for one tier queue on
-- pg_advisory_xact_lock(hashtext('station_tier'), hashtext(tier_id)). The second resumes after the
-- first commits and, because every plpgsql statement under Read Committed takes a fresh snapshot,
-- its station query already sees the first hold's seats. The exclusion constraint on
-- booking_seats remains the final guard for any writer that does not take the lock; under the
-- lock GG005 should never occur in practice. FOR UPDATE SKIP LOCKED on stations was rejected on
-- purpose: it neither re-evaluates NOT EXISTS against a competitor's committed seats nor
-- distinguishes a competitor booking a different hour, and it blocks dashboard edits of stations.
-- The per-caller caps are counted under a second lock,
-- pg_advisory_xact_lock(hashtext('booking_user'), hashtext(user_id)), so two parallel holds by one
-- account cannot both pass the count; it is always taken before the tier lock, so the fixed
-- user -> tier order cannot deadlock. Without the caps one signed-in account could hold every seat
-- of a cafe for 30 days, ten at a time, re-holding on expiry (ADR 0011: the database is the boundary).
create function public.create_booking(
  p_cafe_id uuid,
  p_tier_id uuid,
  p_starts_at timestamptz,
  p_duration_minutes integer,
  p_seat_count integer
)
returns public.booking_details
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_cafe public.cafes%rowtype;
  v_tier public.station_tiers%rowtype;
  v_ends_at timestamptz;
  v_during tstzrange;
  v_station_ids uuid[];
  v_total_paise integer;
  v_booking_id uuid;
  v_result public.booking_details;
begin
  -- 1. caller
  if v_user_id is null then
    raise exception 'authentication required' using errcode = 'GG001';
  end if;

  -- 2. request shape (BOOKING_RULES in @gog/domain pins the same numbers)
  if p_duration_minutes is null
     or p_duration_minutes < 30
     or p_duration_minutes > 360
     or p_duration_minutes % 30 <> 0 then
    raise exception 'duration must be a multiple of 30 minutes between 30 and 360'
      using errcode = 'GG002';
  end if;

  if p_seat_count is null or p_seat_count < 1 or p_seat_count > 10 then
    raise exception 'seat count must be between 1 and 10' using errcode = 'GG002';
  end if;

  -- IST is +05:30, so 30-minute boundaries coincide in IST and UTC.
  if p_starts_at is null or mod(extract(epoch from p_starts_at), 1800) <> 0 then
    raise exception 'start must be on a 30-minute boundary' using errcode = 'GG002';
  end if;

  if p_starts_at < now() + interval '5 minutes' then
    raise exception 'start must be at least 5 minutes from now' using errcode = 'GG002';
  end if;

  if p_starts_at > now() + interval '30 days' then
    raise exception 'start must be within 30 days' using errcode = 'GG002';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => p_duration_minutes);
  v_during := tstzrange(p_starts_at, v_ends_at, '[)');

  -- 3. cafe and tier
  select * into v_cafe from public.cafes where id = p_cafe_id;
  if not found or v_cafe.status <> 'live' then
    raise exception 'cafe is not bookable' using errcode = 'GG006';
  end if;

  select * into v_tier from public.station_tiers where id = p_tier_id and cafe_id = p_cafe_id;
  if not found then
    raise exception 'tier does not belong to this cafe' using errcode = 'GG006';
  end if;

  -- 4. opening hours
  if not public.cafe_is_open_during(p_cafe_id, p_starts_at, v_ends_at) then
    raise exception 'outside opening hours' using errcode = 'GG003';
  end if;

  -- 5. per-caller caps (BOOKING_RULES.maxLiveHolds / maxUpcomingBookings in @gog/domain pin the
  --    same numbers). The user lock serialises the counts with the insert below; a lapsed hold
  --    counts for neither, so a player never has to wait for the sweeper.
  perform pg_advisory_xact_lock(hashtext('booking_user'), hashtext(v_user_id::text));

  if (select count(*)
      from public.bookings
      where user_id = v_user_id
        and status = 'held'
        and hold_expires_at > now()) >= 3 then
    raise exception 'too many live holds, confirm or cancel one first' using errcode = 'GG009';
  end if;

  if (select count(*)
      from public.bookings
      where user_id = v_user_id
        and starts_at > now()
        and (status = 'confirmed' or (status = 'held' and hold_expires_at > now()))) >= 10 then
    raise exception 'too many upcoming bookings' using errcode = 'GG009';
  end if;

  -- 6. serialise allocation for this tier until commit or rollback
  perform pg_advisory_xact_lock(hashtext('station_tier'), hashtext(p_tier_id::text));

  -- 6a. lazy expiry: holds of this tier that lapsed free their seats now (pg_cron is only a sweeper)
  with lapsed as (
    update public.bookings
    set status = 'expired'
    where tier_id = p_tier_id
      and status = 'held'
      and hold_expires_at <= now()
    returning id
  )
  update public.booking_seats
  set released_at = now()
  where released_at is null
    and booking_id in (select id from lapsed);

  -- 6b. free stations under a fresh snapshot (a new statement sees everything the previous lock
  --     holder committed)
  select array_agg(id order by label)
  into v_station_ids
  from (
    select s.id, s.label
    from public.stations s
    where s.tier_id = p_tier_id
      and s.is_active
      and not exists (
        select 1
        from public.booking_seats bs
        where bs.station_id = s.id
          and bs.released_at is null
          and bs.during && v_during
      )
    order by s.label
    limit p_seat_count
  ) t;

  if coalesce(array_length(v_station_ids, 1), 0) < p_seat_count then
    raise exception 'not enough free seats' using errcode = 'GG004';
  end if;

  -- 7. the booking and its seats. Numeric division and round(): integer `/` truncates and
  --    round(integer) is a no-op, which would disagree with the TypeScript quote by a paise.
  v_total_paise := (round((v_tier.hourly_rate_paise::numeric * p_duration_minutes) / 60))::integer
                   * p_seat_count;

  begin
    insert into public.bookings (
      cafe_id, tier_id, user_id, status, starts_at, ends_at, seat_count,
      hourly_rate_paise, cafe_slug, cafe_name, tier_name, tier_kind,
      total_paise, hold_expires_at, source
    )
    values (
      p_cafe_id, p_tier_id, v_user_id, 'held', p_starts_at, v_ends_at, p_seat_count,
      v_tier.hourly_rate_paise, v_cafe.slug, v_cafe.name, v_tier.name, v_tier.kind,
      v_total_paise, now() + interval '10 minutes', 'app'
    )
    returning id into v_booking_id;

    insert into public.booking_seats (booking_id, station_id, station_label, during)
    select v_booking_id, s.id, s.label, v_during
    from public.stations s
    where s.id = any (v_station_ids);
  exception
    when exclusion_violation then
      -- 8. safety net for writers that do not take the tier lock
      raise exception 'seat conflict, please retry' using errcode = 'GG005';
  end;

  -- 9.
  select * into strict v_result from public.booking_details where id = v_booking_id;
  return v_result;
end;
$$;

revoke execute on function public.create_booking(uuid, uuid, timestamptz, integer, integer) from public, anon, authenticated;
grant execute on function public.create_booking(uuid, uuid, timestamptz, integer, integer) to authenticated;
