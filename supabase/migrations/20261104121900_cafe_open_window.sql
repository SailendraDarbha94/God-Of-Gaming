-- cafe_open_window(p_cafe_id uuid, p_day date) returns tstzrange
-- (docs/spec/03-database.md, Functions; ADR 0009.)
--
-- Contract: the cafe's opening window for the opening day p_day, an IST calendar date:
-- [p_day opens_at IST, p_day closes_at IST), with the close moved to the next calendar day when
-- the cafe_hours row is overnight (Friday 22:00-02:00 overnight -> [Fri 16:30Z, Fri 20:30Z)).
-- Returns null when the cafe has no cafe_hours row for that weekday (closed).
-- Stable, security invoker; only called from get_availability and create_booking (security
-- definer), so cafe_hours RLS never applies in practice. Not granted to anon or authenticated.
-- Errors: none.
create function public.cafe_open_window(p_cafe_id uuid, p_day date)
returns tstzrange
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  v_hours public.cafe_hours%rowtype;
  v_opens timestamptz;
  v_closes timestamptz;
begin
  select *
  into v_hours
  from public.cafe_hours h
  where h.cafe_id = p_cafe_id
    and h.weekday = extract(dow from p_day)::smallint;

  if not found then
    return null;
  end if;

  -- date + time is a wall-clock timestamp; AT TIME ZONE turns it into the IST instant.
  v_opens := (p_day + v_hours.opens_at) at time zone 'Asia/Kolkata';
  v_closes := (
    p_day + v_hours.closes_at
    + case when v_hours.is_overnight then interval '1 day' else interval '0' end
  ) at time zone 'Asia/Kolkata';

  return tstzrange(v_opens, v_closes, '[)');
end;
$$;

revoke execute on function public.cafe_open_window(uuid, date) from public, anon, authenticated;
