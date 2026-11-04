-- Local shim for Homebrew Postgres 17 (docs/spec/03-database.md, No-Docker local path).
--
-- Recreates just enough of a Supabase database for the migrations, the seed and the pgTAP tests
-- to run without Docker: the API roles, the auth and extensions schemas, a minimal auth.users,
-- the auth.* JWT helpers as hosted Supabase defines them, and the default privileges Supabase
-- grants in public. No storage schema and no pg_cron: the migrations guard both. Applied by
-- scripts/db/local.sh reset before the migrations; never used by `supabase start` or CI.

-- Roles are cluster-wide, so they may already exist from an earlier reset.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

-- `set local role authenticated` in the tests works the same way it does under `supabase test db`.
-- Guarded so a second reset does not print "already granted" notices.
do $$
declare
  v_role text;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (
      select 1
      from pg_auth_members m
      join pg_roles granted on granted.oid = m.roleid
      join pg_roles member on member.oid = m.member
      where granted.rolname = v_role and member.rolname = current_user
    ) then
      execute format('grant %I to %I', v_role, current_user);
    end if;
  end loop;
end;
$$;

create schema if not exists auth;
create schema if not exists extensions;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema extensions to anon, authenticated, service_role;

-- Supabase's initial schema grants these for everything postgres creates in public, which is why
-- the migrations revoke function execute explicitly and rely on RLS for tables.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Only the columns the migrations and tests touch. GoTrue stores phone as digits without +.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- The three helpers coalesce the legacy per-claim GUC with the single JSON request.jwt.claims GUC
-- that PostgREST >= 9 publishes, as hosted Supabase does. The tests set only request.jwt.claims.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

-- As on Supabase, objects in extensions (btree_gist, pgTAP when installed) resolve unqualified.
do $$
begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
end;
$$;
