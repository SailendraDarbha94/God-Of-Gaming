-- 006: get_availability (docs/spec/03-database.md, Functions).
-- Seed rows: Pixel Den ...301 / Standard PC ...311 (12 stations), hours Sun-Thu 10:00-23:00 and
-- Fri-Sat 10:00-02:00 overnight; Side Quest PS5 ...351, hours daily 11:00-23:30; Respawn Room
-- ...303 / Standard PC ...331; Frame Rate ...302 / Pro PC ...321.
begin;
select plan(16);

create function pg_temp.ist_tomorrow(p_time time) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Asia/Kolkata')::date + 1) + p_time) at time zone 'Asia/Kolkata'
$$;

insert into auth.users (id, phone)
values ('11111111-1111-4111-8111-111111111111', '919999900001');

-- Friday 20 November 2026: 10:00-02:00 overnight is a 16-hour window
select is(
  (select count(*)::integer from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-20')),
  31,
  '31 one-hour starts at 30-minute steps in a 16-hour overnight window'
);
select is(
  (select min(starts_at) from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-20')),
  timestamptz '2026-11-20 10:00:00+05:30',
  'the first start is the opening time'
);
select is(
  (select max(starts_at) from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-20')),
  timestamptz '2026-11-21 01:00:00+05:30',
  'the last start ends exactly at closing, past midnight'
);
select is(
  (select min(free_seats) from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-20')),
  12,
  'every station is free when there are no bookings'
);

-- Thursday 19 November 2026: 10:00-23:00
select is(
  (select count(*)::integer from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-19')),
  25,
  '25 one-hour starts in a 13-hour day'
);
select is(
  (select count(*)::integer from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-19', 120, 60)),
  12,
  'duration and step are honoured (120 minutes, hourly)'
);
select is(
  (select count(*)::integer from public.get_availability('00000000-0000-4000-8000-000000000351', date '2026-11-19')),
  24,
  'Side Quest 11:00-23:30 gives 24 one-hour starts'
);

-- zero rows, never an error
select is_empty(
  $$select * from public.get_availability('00000000-0000-4000-8000-000000000000', date '2026-11-19')$$,
  'an unknown tier yields no rows'
);
delete from public.cafe_hours where cafe_id = '00000000-0000-4000-8000-000000000303' and weekday = 4;
select is_empty(
  $$select * from public.get_availability('00000000-0000-4000-8000-000000000331', date '2026-11-19')$$,
  'a closed weekday yields no rows'
);
update public.cafes set status = 'paused' where id = '00000000-0000-4000-8000-000000000302';
select is_empty(
  $$select * from public.get_availability('00000000-0000-4000-8000-000000000321', date '2026-11-19')$$,
  'a paused cafe yields no rows'
);
select throws_ok(
  $$select * from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-19', 0, 30)$$,
  'GG002', null, 'a non-positive duration is GG002'
);

-- anon may call it
set local role anon;
select lives_ok(
  $$select * from public.get_availability('00000000-0000-4000-8000-000000000311', date '2026-11-20')$$,
  'anon can read availability'
);
reset role;

-- one seat less after a hold
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table hold1 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('12:00'), 60, 1
);
create temp table tomorrow as select ((now() at time zone 'Asia/Kolkata')::date + 1) as day;

select is(
  (select free_seats from public.get_availability('00000000-0000-4000-8000-000000000311', (select day from tomorrow))
   where starts_at = pg_temp.ist_tomorrow('12:00')),
  11,
  'one seat less at the held start'
);
select is(
  (select free_seats from public.get_availability('00000000-0000-4000-8000-000000000311', (select day from tomorrow))
   where starts_at = pg_temp.ist_tomorrow('11:30')),
  11,
  'one seat less at the overlapping 11:30 start'
);
select is(
  (select free_seats from public.get_availability('00000000-0000-4000-8000-000000000311', (select day from tomorrow))
   where starts_at = pg_temp.ist_tomorrow('13:00')),
  12,
  'all seats at the adjacent start'
);

-- a lapsed hold no longer counts as taken
reset role;
update public.bookings set hold_expires_at = now() - interval '1 minute' where id = (select id from hold1);
select is(
  (select free_seats from public.get_availability('00000000-0000-4000-8000-000000000311', (select day from tomorrow))
   where starts_at = pg_temp.ist_tomorrow('12:00')),
  12,
  'a lapsed hold frees its seat in the availability count'
);

select * from finish();
rollback;
