-- 004: confirm_booking, cancel_booking and expire_holds (docs/spec/03-database.md, Functions).
-- Users: 1111... (player), 2222... (another player), 3333... (member of Pixel Den).
-- Seed rows: Pixel Den ...301 / Standard PC ...311; Overclock Lounge ...304 / VR Bay ...342
-- (2 stations).
begin;
select plan(21);

create function pg_temp.ist_tomorrow(p_time time) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Asia/Kolkata')::date + 1) + p_time) at time zone 'Asia/Kolkata'
$$;

insert into auth.users (id, phone) values
  ('11111111-1111-4111-8111-111111111111', '919999900001'),
  ('22222222-2222-4222-8222-222222222222', '919999900002'),
  ('33333333-3333-4333-8333-333333333333', '919999900003');

insert into public.cafe_members (cafe_id, user_id, role)
values ('00000000-0000-4000-8000-000000000301', '33333333-3333-4333-8333-333333333333', 'owner');

set local role authenticated;

-- no sub claim
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok(
  $$select public.confirm_booking('00000000-0000-4000-8000-000000000000')$$,
  'GG001', null, 'confirm requires a signed-in user'
);
select throws_ok(
  $$select public.cancel_booking('00000000-0000-4000-8000-000000000000')$$,
  'GG001', null, 'cancel requires a signed-in user'
);

-- user 1 holds two seats
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table hold1 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('12:00'), 60, 1
);

select throws_ok(
  $$select public.confirm_booking('00000000-0000-4000-8000-000000000000')$$,
  'GG007', null, 'confirming an unknown booking is GG007'
);

-- user 2 cannot confirm it
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select public.confirm_booking((select id from hold1))$$,
  'GG007', null, 'another user cannot confirm the hold'
);

-- the owner can
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table confirmed1 as select * from public.confirm_booking((select id from hold1));
select is((select status::text from confirmed1), 'confirmed', 'the owner confirms the hold');
select ok((select hold_expires_at is null from confirmed1), 'a confirmed booking has no hold expiry');
select throws_ok(
  $$select public.confirm_booking((select id from hold1))$$,
  'GG008', null, 'confirming twice is GG008'
);
select is(
  (select status::text from public.cancel_booking((select id from hold1))),
  'cancelled',
  'the owner cancels a confirmed booking'
);

-- expire_holds(): the only lapsed hold at this point
create temp table hold_sweep as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('18:00'), 60, 2
);
reset role;
update public.bookings set hold_expires_at = now() - interval '1 minute' where id = (select id from hold_sweep);
select is(public.expire_holds(), 1, 'expire_holds() expires the one lapsed hold and returns 1');
select is(
  (select status::text from public.bookings where id = (select id from hold_sweep)),
  'expired',
  'the lapsed hold is expired'
);
select is(
  (select count(*)::integer from public.booking_seats
   where booking_id = (select id from hold_sweep) and released_at is null),
  0,
  'its seats are released'
);
select is(public.expire_holds(), 0, 'a second sweep finds nothing');

-- a lapsed hold cannot be confirmed
set local role authenticated;
create temp table hold2 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('14:00'), 60, 1
);
reset role;
update public.bookings set hold_expires_at = now() - interval '1 minute' where id = (select id from hold2);
set local role authenticated;
select throws_ok(
  $$select public.confirm_booking((select id from hold2))$$,
  'GG008', null, 'a lapsed hold cannot be confirmed'
);

-- cancel releases seats: the VR bay has two stations
create temp table hold3 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000342',
  pg_temp.ist_tomorrow('12:00'), 60, 2
);
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000342',
                                 pg_temp.ist_tomorrow('12:00'), 60, 1)$$,
  'GG004', null, 'the VR bay is full while the hold stands'
);
select throws_ok(
  $$select public.cancel_booking((select id from hold3))$$,
  'GG007', null, 'an unrelated user cannot cancel it'
);
-- user 3 is a member of Pixel Den, not of Overclock Lounge
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select throws_ok(
  $$select public.cancel_booking((select id from hold3))$$,
  'GG007', null, 'a member of another cafe cannot cancel it'
);

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table cancelled3 as select * from public.cancel_booking((select id from hold3));
select is((select status::text from cancelled3), 'cancelled', 'the owner cancels the hold');
select is(
  (select count(*)::integer from jsonb_array_elements((select seats from cancelled3)) as e
   where e ->> 'released_at' is null),
  0,
  'cancel releases every seat'
);
select throws_ok(
  $$select public.cancel_booking((select id from hold3))$$,
  'GG008', null, 'cancelling a cancelled booking is GG008'
);

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select lives_ok(
  $$select public.create_booking('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000342',
                                 pg_temp.ist_tomorrow('12:00'), 60, 2)$$,
  'the slot is bookable again after the cancel'
);

-- a cafe member cancels a booking at their cafe
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table hold4 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('16:00'), 60, 1
);
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select is(
  (select status::text from public.cancel_booking((select id from hold4))),
  'cancelled',
  'a cafe member can cancel a booking at their cafe'
);

select * from finish();
rollback;
