-- 003: create_booking (docs/spec/03-database.md, Functions).
-- Seed rows used: Pixel Den 00000000-0000-4000-8000-000000000301 with Standard PC tier ...311
-- (12 stations, 8000 paise) and PS5 Lounge tier ...313 (4 stations, 15000 paise); Frame Rate
-- ...302 with Pro PC tier ...321; Side Quest ...305 with PS5 tier ...351 (11:00-23:30 daily, no
-- overnight). Every cafe is open tomorrow between 12:00 and 22:00 IST and closed at 08:00.
-- Users: 1111... exercises the rules and the per-account caps (GG009), 2222... the capacity and
-- lazy-expiry paths (the caps would otherwise get in the way), 3333... the opening-hour edges.
begin;
select plan(35);

create function pg_temp.ist_tomorrow(p_time time) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Asia/Kolkata')::date + 1) + p_time) at time zone 'Asia/Kolkata'
$$;

-- The next calendar day with the given weekday (0 = Sunday), strictly after today in IST.
create function pg_temp.ist_next_weekday(p_dow integer) returns date
language sql stable as $$
  select (now() at time zone 'Asia/Kolkata')::date
         + ((p_dow - extract(dow from (now() at time zone 'Asia/Kolkata')::date)::integer + 6) % 7 + 1)
$$;

insert into auth.users (id, phone) values
  ('11111111-1111-4111-8111-111111111111', '919999900001'),
  ('22222222-2222-4222-8222-222222222222', '919999900002'),
  ('33333333-3333-4333-8333-333333333333', '919999900003');

-- anon: the function is not granted, so permission is denied before the body runs
set local role anon;
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('12:00'), 60, 1)$$,
  '42501',
  null,
  'anon gets permission denied'
);
reset role;

-- authenticated without a sub claim
set local role authenticated;
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('12:00'), 60, 1)$$,
  'GG001',
  null,
  'GG001 without a sub claim'
);

-- as user 1
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('12:00'), 45, 1)$$,
  'GG002', null, 'GG002 for a 45-minute duration'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('12:00'), 60, 11)$$,
  'GG002', null, 'GG002 for 11 seats'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('12:15'), 60, 1)$$,
  'GG002', null, 'GG002 for a start off the 30-minute grid'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 date_trunc('hour', now()), 60, 1)$$,
  'GG002', null, 'GG002 for a start less than 5 minutes away'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 date_trunc('hour', now()) + interval '31 days', 60, 1)$$,
  'GG002', null, 'GG002 for a start more than 30 days away'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('08:00'), 60, 1)$$,
  'GG003', null, 'GG003 before opening time'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000321',
                                 pg_temp.ist_tomorrow('12:00'), 60, 1)$$,
  'GG006', null, 'GG006 when the tier belongs to another cafe'
);

reset role;
update public.cafes set status = 'paused' where id = '00000000-0000-4000-8000-000000000302';
set local role authenticated;
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000321',
                                 pg_temp.ist_tomorrow('12:00'), 60, 1)$$,
  'GG006', null, 'GG006 when the cafe is not live'
);

select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
                                 pg_temp.ist_tomorrow('12:00'), 60, 5)$$,
  'GG004', null, 'GG004 when asking for more seats than the tier has'
);

-- a valid request
create temp table hold1 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('12:00'), 60, 2
);

select is((select status::text from hold1), 'held', 'a valid request returns a held booking');
select is((select total_paise from hold1), 16000, 'total_paise = 8000 paise x 60 min x 2 seats');
select is((select hourly_rate_paise from hold1), 8000, 'the hourly rate is copied from the tier');
select is((select ends_at from hold1), pg_temp.ist_tomorrow('13:00'), 'ends_at = starts_at + duration');
select ok(
  (select hold_expires_at from hold1) between now() + interval '9 minutes' and now() + interval '11 minutes',
  'hold_expires_at is about 10 minutes from now'
);
select is((select jsonb_array_length(seats) from hold1), 2, 'exactly seat_count seats are allocated');
select is((select cafe_name from hold1), 'Pixel Den', 'the cafe name is copied at hold time');
select is((select seats -> 0 ->> 'station_label' from hold1), 'STD-01', 'stations are allocated lowest label first');

-- odd-paise rounding is pinned (numeric round, ties away from zero, same as Math.round)
reset role;
update public.station_tiers set hourly_rate_paise = 8025 where id = '00000000-0000-4000-8000-000000000311';
set local role authenticated;
create temp table rate_30 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('14:00'), 30, 1
);
select is((select total_paise from rate_30), 4013, '8025 paise x 30 min x 1 seat = 4013 (4012.5 rounds up)');
create temp table rate_90 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('15:00'), 90, 3
);
select is(
  (select total_paise from rate_90),
  36114,
  '8025 paise x 90 min x 3 seats = 36114 (12037.5 rounds to 12038 per seat)'
);

-- per-account caps: user 1 now has three live holds (12:00, 14:00, 15:00)
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('17:00'), 60, 1)$$,
  'GG009', null, 'GG009 for a fourth live hold'
);
select is(
  (select status::text from public.cancel_booking((select id from hold1))),
  'cancelled',
  'cancelling one of the live holds'
);
create temp table hold_after as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('17:00'), 60, 1
);
select is((select status::text from hold_after), 'held', 'frees a slot under the live-hold cap');

-- ten upcoming bookings: confirm the three live holds, then hold and confirm seven more
do $$
declare
  t time;
begin
  perform public.confirm_booking((select id from rate_30));
  perform public.confirm_booking((select id from rate_90));
  perform public.confirm_booking((select id from hold_after));
  foreach t in array array['10:00', '11:00', '12:00', '13:00', '18:00', '19:00', '20:00']::time[] loop
    perform public.confirm_booking((public.create_booking(
      '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
      pg_temp.ist_tomorrow(t), 60, 1
    )).id);
  end loop;
end
$$;
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('21:00'), 60, 1)$$,
  'GG009', null, 'GG009 for an eleventh upcoming booking'
);
select is(
  (select status::text from public.cancel_booking((select id from rate_30))),
  'cancelled',
  'cancelling one of the upcoming bookings'
);
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 pg_temp.ist_tomorrow('21:00'), 60, 1)$$,
  'frees a slot under the upcoming cap'
);

-- as user 2: capacity. PS5 Lounge has four stations
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
                                 pg_temp.ist_tomorrow('12:00'), 60, 4)$$,
  'all four PS5 seats can be held'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
                                 pg_temp.ist_tomorrow('12:30'), 60, 1)$$,
  'GG004', null, 'GG004 when an overlapping hold would exceed capacity'
);
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
                                 pg_temp.ist_tomorrow('13:00'), 60, 4)$$,
  'the adjacent hour is still free'
);

-- lazy expiry: a lapsed hold of the tier frees its seats for the next caller (and counts for no cap)
create temp table lapsed as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
  pg_temp.ist_tomorrow('16:00'), 60, 4
);
reset role;
update public.bookings set hold_expires_at = now() - interval '1 minute' where id = (select id from lapsed);
set local role authenticated;
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000313',
                                 pg_temp.ist_tomorrow('16:00'), 60, 4)$$,
  'a lapsed hold frees its seats for the next caller'
);
reset role;
select is(
  (select status::text from public.bookings where id = (select id from lapsed)),
  'expired',
  'the lapsed hold was expired on the way'
);
select is(
  (select count(*)::integer from public.booking_seats
   where booking_id = (select id from lapsed) and released_at is null),
  0,
  'and its seats were released'
);

-- as user 3: opening-hour edges
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
-- Pixel Den opens Friday 10:00-02:00 overnight, so Saturday 01:00-02:00 belongs to Friday's window
-- (the `v_day - 1` branch of cafe_is_open_during that the app's "Late night" option relies on).
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
                                 ((pg_temp.ist_next_weekday(5) + 1) + time '01:00') at time zone 'Asia/Kolkata', 60, 1)$$,
  'a post-midnight start inside the previous day''s overnight window is accepted'
);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000351',
                                 pg_temp.ist_tomorrow('23:00'), 60, 1)$$,
  'GG003', null, 'GG003 when the session runs past closing time'
);

select * from finish();
rollback;
