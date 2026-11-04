-- cafe_is_open_during(p_cafe_id uuid, p_starts timestamptz, p_ends timestamptz) returns boolean
-- (docs/spec/03-database.md, Functions.)
--
-- Contract: true when [p_starts, p_ends) sits inside the opening window of the IST day of
-- p_starts, or inside the previous day's overnight window (a Saturday 00:30-01:30 session inside
-- a Friday 22:00-02:00 window). False, never null, when both windows are null or when
-- p_ends <= p_starts. Known limit: a session that crosses a window boundary (23:30-00:30 at a
-- cafe that closes 00:00 and reopens 00:00) is rejected.
-- Stable, security invoker; called from create_booking. Not granted to anon or authenticated.
-- Errors: none.
create function public.cafe_is_open_during(p_cafe_id uuid, p_starts timestamptz, p_ends timestamptz)
returns boolean
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  v_day date;
  v_range tstzrange;
begin
  if p_starts is null or p_ends is null or p_ends <= p_starts then
    return false;
  end if;

  v_day := (p_starts at time zone 'Asia/Kolkata')::date;
  v_range := tstzrange(p_starts, p_ends, '[)');

  return coalesce(v_range <@ public.cafe_open_window(p_cafe_id, v_day), false)
      or coalesce(v_range <@ public.cafe_open_window(p_cafe_id, v_day - 1), false);
end;
$$;

revoke execute on function public.cafe_is_open_during(uuid, timestamptz, timestamptz) from public, anon, authenticated;
