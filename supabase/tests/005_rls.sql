-- 005: row level security (docs/spec/03-database.md, Row Level Security; ADR 0011).
-- Users: 1111... holds at Pixel Den, 2222... holds at Frame Rate, 3333... is staff at Pixel Den.
begin;
select plan(24);

create function pg_temp.ist_tomorrow(p_time time) returns timestamptz
language sql stable as $$
  select (((now() at time zone 'Asia/Kolkata')::date + 1) + p_time) at time zone 'Asia/Kolkata'
$$;

insert into auth.users (id, phone) values
  ('11111111-1111-4111-8111-111111111111', '919999900001'),
  ('22222222-2222-4222-8222-222222222222', '919999900002'),
  ('33333333-3333-4333-8333-333333333333', '919999900003');

insert into public.cafe_members (cafe_id, user_id, role)
values ('00000000-0000-4000-8000-000000000301', '33333333-3333-4333-8333-333333333333', 'staff');

-- a draft cafe with a tier, and one unpublished promotion
insert into public.cafes (id, slug, name, area_id, status, address_line, lat, lng)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'draft-cafe', 'Draft Cafe',
        '00000000-0000-4000-8000-000000000101', 'draft', 'Nowhere yet', 12.93, 77.62);
insert into public.station_tiers (cafe_id, kind, name, hourly_rate_paise)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'pc', 'Draft PC', 1000);
update public.promotions set is_published = false where slug = 'late-night-pc-rates';

-- one hold each for users 1 and 2
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
create temp table hold1 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000311',
  pg_temp.ist_tomorrow('12:00'), 60, 1
);
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
create temp table hold2 as
select * from public.create_booking(
  '00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000321',
  pg_temp.ist_tomorrow('12:00'), 60, 1
);
reset role;

-- anon
set local role anon;
select is((select count(*)::integer from public.cafes), 6, 'anon sees the six live cafes');
select is_empty($$select * from public.cafes where slug = 'draft-cafe'$$, 'anon does not see the draft cafe');
select is_empty($$select * from public.station_tiers where name = 'Draft PC'$$, 'anon does not see tiers of the draft cafe');
select is((select count(*)::integer from public.cities), 1, 'anon sees only the live city');
select is((select count(*)::integer from public.areas), 18, 'anon sees the areas of the live city');
select is((select count(*)::integer from public.promotions), 3, 'anon sees only published promotions');
select is((select count(*)::integer from public.cafe_cards), 6, 'cafe_cards shows the six live cafes');
select is_empty($$select * from public.bookings$$, 'anon sees no bookings');
select is_empty($$select * from public.booking_seats$$, 'anon sees no booking seats');
select is_empty($$select * from public.profiles$$, 'anon sees no profiles');
select is_empty($$select * from public.cafe_members$$, 'anon sees no cafe members');
reset role;

-- user 1 sees only their own bookings
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select results_eq(
  $$select id from public.bookings$$,
  $$select id from hold1$$,
  'a user sees only their own bookings'
);
select is((select count(*)::integer from public.booking_details), 1, 'booking_details is filtered the same way');
select is((select count(*)::integer from public.booking_seats), 1, 'and so are the seats');

-- user 3, staff at Pixel Den, sees the bookings of that cafe
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select results_eq(
  $$select id from public.bookings$$,
  $$select id from hold1$$,
  'a cafe member sees the bookings at their cafe and no others'
);
select is((select count(*)::integer from public.cafe_members), 1, 'a member sees their own membership row');

-- user 2
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select results_eq(
  $$select id from public.bookings$$,
  $$select id from hold2$$,
  'another user sees only theirs'
);

-- profiles: created by the trigger, readable and partly editable by the owner only
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  (select phone from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  '919999900001',
  'handle_new_user copied the phone into profiles'
);
select is((select count(*)::integer from public.profiles), 1, 'a user sees only their own profile');
select throws_ok(
  $$update public.profiles set phone = '910000000000' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'the owner cannot change phone'
);
select lives_ok(
  $$update public.profiles set display_name = 'Sai' where id = '11111111-1111-4111-8111-111111111111'$$,
  'the owner can change display_name'
);
select is(
  (select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Sai',
  'the change is visible to the owner'
);
select lives_ok(
  $$update public.profiles set display_name = 'Nope' where id = '22222222-2222-4222-8222-222222222222'$$,
  'updating another profile raises nothing'
);
reset role;
select is(
  (select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  null::text,
  'but changes nothing'
);

select * from finish();
rollback;
