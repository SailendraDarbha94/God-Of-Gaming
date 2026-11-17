-- 001: the schema exists as docs/spec/03-database.md describes it.
begin;
select plan(55);

-- Enums
select has_enum('public', 'station_kind', 'enum station_kind exists');
select has_enum('public', 'cafe_status', 'enum cafe_status exists');
select has_enum('public', 'booking_status', 'enum booking_status exists');
select has_enum('public', 'booking_source', 'enum booking_source exists');
select has_enum('public', 'cafe_member_role', 'enum cafe_member_role exists');

-- Tables (14)
select has_table('public', t, format('table %s exists', t))
from unnest(array[
  'cities', 'areas', 'cafes', 'cafe_images', 'cafe_hours', 'station_tiers', 'stations',
  'games', 'cafe_games', 'promotions', 'profiles', 'cafe_members', 'bookings', 'booking_seats'
]) as t;

-- Views
select has_view('public', 'cafe_cards', 'view cafe_cards exists');
select has_view('public', 'booking_details', 'view booking_details exists');
select has_view('public', 'my_booking_details', 'view my_booking_details exists');

-- Every view in public is security_invoker, so its readers' policies apply. `create or replace view`
-- replaces a view's options with its own, so a replacement that forgets `with (security_invoker =
-- true)` would read the tables as the view's owner and fail here.
select is_empty(
  $$select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
      and not coalesce(c.reloptions @> array['security_invoker=true'], false)$$,
  'every view in public is security_invoker'
);

-- Extensions
select ok(
  exists (select 1 from pg_extension where extname = 'btree_gist'),
  'btree_gist is installed'
);
select ok(
  not exists (select 1 from pg_available_extensions where name = 'pg_cron')
  or exists (select 1 from pg_extension where extname = 'pg_cron'),
  'pg_cron is installed when the server offers it'
);

-- RLS on every table in public
select is_empty(
  $$select tablename from pg_tables where schemaname = 'public' and not rowsecurity$$,
  'row level security is enabled on every table in public'
);

-- The exclusion constraint
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.booking_seats'::regclass and contype = 'x'
  ),
  'booking_seats has an exclusion constraint'
);

-- Overnight hours must close at or before the opening time
delete from public.cafe_hours
where cafe_id = '00000000-0000-4000-8000-000000000301' and weekday = 0;
select throws_ok(
  $$insert into public.cafe_hours (cafe_id, weekday, opens_at, closes_at, is_overnight)
    values ('00000000-0000-4000-8000-000000000301', 0, '10:00', '23:00', true)$$,
  '23514',
  null,
  'an overnight row that closes after it opens is rejected'
);

-- Profiles are created by the auth.users trigger
select has_trigger('auth', 'users', 'on_auth_user_created', 'on_auth_user_created trigger exists');

-- Function privileges, the whole matrix (19): Supabase grants every new public function to anon
-- and authenticated by default, so a migration that forgets the revoke would otherwise pass CI.
select ok(
  has_function_privilege(r, f, 'execute') = expected,
  format('%s %s execute on %s', r, case when expected then 'can' else 'cannot' end, f)
)
from (values
  ('anon',          'public.expire_holds()',                                              false),
  ('authenticated', 'public.expire_holds()',                                              false),
  ('anon',          'public.create_booking(uuid, uuid, timestamptz, integer, integer)',    false),
  ('authenticated', 'public.create_booking(uuid, uuid, timestamptz, integer, integer)',    true),
  ('anon',          'public.confirm_booking(uuid)',                                       false),
  ('authenticated', 'public.confirm_booking(uuid)',                                       true),
  ('anon',          'public.cancel_booking(uuid)',                                        false),
  ('authenticated', 'public.cancel_booking(uuid)',                                        true),
  ('anon',          'public.get_availability(uuid, date, integer, integer)',               true),
  ('authenticated', 'public.get_availability(uuid, date, integer, integer)',               true),
  ('public',        'public.get_availability(uuid, date, integer, integer)',               false),
  ('anon',          'public.cafe_open_window(uuid, date)',                                false),
  ('authenticated', 'public.cafe_open_window(uuid, date)',                                false),
  ('anon',          'public.cafe_is_open_during(uuid, timestamptz, timestamptz)',         false),
  ('authenticated', 'public.cafe_is_open_during(uuid, timestamptz, timestamptz)',         false),
  ('anon',          'public.handle_new_user()',                                           false),
  ('authenticated', 'public.handle_new_user()',                                           false),
  ('anon',          'public.set_updated_at()',                                            false),
  ('authenticated', 'public.set_updated_at()',                                            false)
) as t(r, f, expected);

-- Table privileges (4): clients write booking rows only through the functions, and RLS never
-- applies to TRUNCATE, so the write privileges themselves are revoked (migration 122800).
select ok(
  not has_table_privilege('authenticated', 'public.bookings', 'truncate'),
  'authenticated cannot truncate bookings'
);
select ok(
  not has_table_privilege('authenticated', 'public.bookings', 'update'),
  'authenticated cannot update bookings directly'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'update'),
  'anon cannot update profiles'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'),
  'authenticated keeps the column grant on profiles.display_name'
);

-- Schema-wide (docs/spec/03-database.md, Row Level Security). Supabase's default privileges grant ALL
-- on every new table, view and function in public to anon and authenticated, so a migration that
-- forgets its revoke fails one of these. Column grants such as profiles.display_name are not table
-- privileges and pass.
select is_empty(
  $$select format('%s can %s %s', r.rolname, p.privilege, c.oid::regclass)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) as r(rolname)
    cross join (values ('insert'), ('update'), ('delete'), ('truncate')) as p(privilege)
    where n.nspname = 'public'
      and c.relkind in ('r', 'v', 'p')
      and has_table_privilege(r.rolname, c.oid, p.privilege)$$,
  'no table or view in public grants insert, update, delete or truncate to anon or authenticated'
);

-- The functions each client role can execute, extension members left out, as of this milestone
-- (docs/spec/iteration-2/03-database.md, Grants). A new function is added here with its grant.
select is(
  array(
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
      )
    order by 1
  ),
  array['get_availability(uuid,date,integer,integer)'],
  'anon can execute get_availability and no other function in public'
);
select is(
  array(
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('authenticated', p.oid, 'execute')
      and not exists (
        select 1
        from pg_depend d
        where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
      )
    order by 1
  ),
  array[
    'cancel_booking(uuid)',
    'confirm_booking(uuid)',
    'create_booking(uuid,uuid,timestamp with time zone,integer,integer)',
    'get_availability(uuid,date,integer,integer)'
  ],
  'authenticated can execute the booking functions and no other function in public'
);

select * from finish();
rollback;
