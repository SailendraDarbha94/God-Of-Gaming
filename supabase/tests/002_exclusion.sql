-- 002: the booking_seats exclusion constraint (ADR 0005).
-- Bookings are inserted directly here; the function path is covered by 003.
begin;
select plan(5);

insert into auth.users (id, phone)
values ('11111111-1111-4111-8111-111111111111', '919999900001');

-- Four holds on Pixel Den's Standard PC tier; each test seat belongs to a different booking
-- because (booking_id, station_id) is unique.
insert into public.bookings (
  id, cafe_id, tier_id, user_id, status, starts_at, ends_at, seat_count,
  hourly_rate_paise, cafe_slug, cafe_name, tier_name, tier_kind, total_paise, hold_expires_at
)
select
  b.id,
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000311',
  '11111111-1111-4111-8111-111111111111',
  'held',
  timestamptz '2026-11-20 10:00:00+05:30',
  timestamptz '2026-11-20 12:00:00+05:30',
  1, 8000, 'pixel-den-koramangala', 'Pixel Den', 'Standard PC', 'pc', 16000,
  now() + interval '10 minutes'
from unnest(array[
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid,
  'aaaaaaaa-0000-4000-8000-000000000002'::uuid,
  'aaaaaaaa-0000-4000-8000-000000000003'::uuid,
  'aaaaaaaa-0000-4000-8000-000000000004'::uuid
]) as b (id);

-- Station STD-01 of that tier
select lives_ok(
  $$insert into public.booking_seats (booking_id, station_id, station_label, during)
    values ('aaaaaaaa-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000031101', 'STD-01',
            tstzrange('2026-11-20 10:00:00+05:30', '2026-11-20 11:00:00+05:30', '[)'))$$,
  'a first seat [10:00, 11:00) on STD-01 is accepted'
);

select throws_ok(
  $$insert into public.booking_seats (booking_id, station_id, station_label, during)
    values ('aaaaaaaa-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000031101', 'STD-01',
            tstzrange('2026-11-20 10:30:00+05:30', '2026-11-20 11:30:00+05:30', '[)'))$$,
  '23P01',
  null,
  'an overlapping unreleased seat [10:30, 11:30) on the same station fails with exclusion_violation'
);

select lives_ok(
  $$insert into public.booking_seats (booking_id, station_id, station_label, during)
    values ('aaaaaaaa-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000031101', 'STD-01',
            tstzrange('2026-11-20 11:00:00+05:30', '2026-11-20 12:00:00+05:30', '[)'))$$,
  'the adjacent range [11:00, 12:00) is accepted'
);

update public.booking_seats
set released_at = now()
where booking_id = 'aaaaaaaa-0000-4000-8000-000000000001';

select lives_ok(
  $$insert into public.booking_seats (booking_id, station_id, station_label, during)
    values ('aaaaaaaa-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000031101', 'STD-01',
            tstzrange('2026-11-20 10:00:00+05:30', '2026-11-20 11:00:00+05:30', '[)'))$$,
  'a released seat does not block the same range'
);

select is(
  (select count(*)::integer from public.booking_seats
   where station_id = '00000000-0000-4000-8000-000000031101' and released_at is null),
  2,
  'two unreleased seats remain on STD-01'
);

select * from finish();
rollback;
