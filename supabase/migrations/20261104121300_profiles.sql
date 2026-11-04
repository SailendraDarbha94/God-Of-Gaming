-- profiles and handle_new_user() (docs/spec/03-database.md, Tables > People; ADR 0011).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  phone text,
  home_city_id uuid references public.cities (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth user, created by handle_new_user(). We store a phone number and an optional display name, nothing else.';
comment on column public.profiles.phone is
  'Digits without +, exactly as GoTrue stores auth.users.phone (919999900001); + is rendered at the display edge.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: owner can read"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: owner can update"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Column privileges: phone and id are written only by handle_new_user(); the owner edits the rest.
revoke update on public.profiles from authenticated;
grant update (display_name, home_city_id) on public.profiles to authenticated;

-- handle_new_user(): trigger function on auth.users.
--
-- Contract: `after insert for each row` on auth.users; inserts the profiles row with the user's id
-- and phone (GoTrue creates the user when the OTP is requested, so the row exists before the first
-- sign-in completes). Security definer because GoTrue's role has no privileges on public.profiles.
-- Errors: none of our own; a duplicate id would surface as unique_violation (23505).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
