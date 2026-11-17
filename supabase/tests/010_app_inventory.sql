-- 010: app inventory (docs/spec/iteration-2/03-database.md, pgTAP). M0: my_booking_details and the
-- booker-only bookings policy (ADR 0015, ADR 0017). M2 and M4 add create_booking and get_availability
-- under the new rules, the app-booking settings, approval, suspension, station service and closures.
-- Users (9199998000NN, never the persona numbers): 1111... and 2222... are players with a hold each at
-- Pixel Den; 3333... is staff at Pixel Den and holds one seat there as a player.
begin;
select plan(13);

create function pg_temp.ist_tomorrow(p_time time) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Asia/Kolkata')::date + 1) + p_time) at time zone 'Asia/Kolkata'
$$;

-- Each caller's claims, as GoTrue issues them after an SMS code (`amr` method otp).
create function pg_temp.claims(p_sub uuid) returns text
language sql immutable as $$
  select jsonb_build_object(
    'sub', p_sub,
    'role', 'authenticated',
    'amr', jsonb_build_array(jsonb_build_object('method', 'otp', 'timestamp', 0))
  )::text
$$;

insert into auth.users (id, phone, phone_confirmed_at) values
  ('11111111-1111-4111-8111-111111111111', '919999800001', now()),
  ('22222222-2222-4222-8222-222222222222', '919999800002', now()),
  ('33333333-3333-4333-8333-333333333333', '919999800003', now());

insert into public.cafe_members (cafe_id, user_id, role)
values ('00000000-0000-4000-8000-000000000301', '33333333-3333-4333-8333-333333333333', 'staff');

-- One hold each on Pixel Den's Standard PC tier, tomorrow.
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims('11111111-1111-4111-8111-111111111111'), true);
create temp table player1_hold as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('12:00'), 60, 2
);
select set_config('request.jwt.claims', pg_temp.claims('22222222-2222-4222-8222-222222222222'), true);
create temp table player2_hold as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('14:00'), 60, 1
);
select set_config('request.jwt.claims', pg_temp.claims('33333333-3333-4333-8333-333333333333'), true);
create temp table staff_hold as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('16:00'), 60, 1
);
reset role;

select policies_are(
  'public', 'bookings', array['bookings: the booker can read'],
  'bookings has one policy, the booker''s own rows'
);

-- The staff member of Pixel Den sees their own booking there and no other player's.
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims('33333333-3333-4333-8333-333333333333'), true);
select results_eq(
  $$select id from public.bookings$$,
  $$select id from staff_hold$$,
  'a member of Pixel Den reads only their own booking from bookings'
);
select results_eq(
  $$select id from public.booking_details$$,
  $$select id from staff_hold$$,
  'and from booking_details'
);
select results_eq(
  $$select distinct booking_id from public.booking_seats$$,
  $$select id from staff_hold$$,
  'and only their own seats from booking_seats'
);
select results_eq(
  $$select id from public.my_booking_details$$,
  $$select id from staff_hold$$,
  'and only their own booking from my_booking_details'
);
select is_empty(
  $$select 1 from public.booking_details
    where id in (select id from player1_hold union all select id from player2_hold)$$,
  'no other player''s Pixel Den booking is readable by the member, by id'
);
select is_empty(
  $$select 1 from public.booking_details where user_id <> '33333333-3333-4333-8333-333333333333'$$,
  'no booking_details row carries another user''s id'
);

-- A player's "My bookings" is their own booking, with its seats.
select set_config('request.jwt.claims', pg_temp.claims('11111111-1111-4111-8111-111111111111'), true);
select results_eq(
  $$select id from public.my_booking_details$$,
  $$select id from player1_hold$$,
  'my_booking_details lists the caller''s own booking'
);
select is(
  (select jsonb_array_length(seats) from public.my_booking_details),
  2,
  'with both of its seats'
);

-- The view filters by itself, not only through the policy: as the table owner (RLS bypassed), a
-- caller's claims still select only that caller's rows.
reset role;
select set_config('request.jwt.claims', pg_temp.claims('22222222-2222-4222-8222-222222222222'), true);
select results_eq(
  $$select id from public.my_booking_details$$,
  $$select id from player2_hold$$,
  'my_booking_details filters to auth.uid() even where RLS does not apply'
);

-- Signed out: nothing.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is_empty($$select 1 from public.my_booking_details$$, 'anon reads nothing from my_booking_details');
reset role;

-- Writes are revoked; reads stay granted (RLS and the filter apply).
select ok(
  not has_table_privilege('authenticated', 'public.my_booking_details', 'insert')
  and not has_table_privilege('authenticated', 'public.my_booking_details', 'update')
  and not has_table_privilege('authenticated', 'public.my_booking_details', 'delete'),
  'authenticated cannot write my_booking_details'
);
select ok(
  has_table_privilege('authenticated', 'public.my_booking_details', 'select'),
  'authenticated can select my_booking_details'
);

select * from finish();
rollback;
