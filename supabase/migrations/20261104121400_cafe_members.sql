-- cafe_members (docs/spec/03-database.md, Tables > People). Owners and staff of a cafe; the
-- partner surface (dashboard or app) builds on this table.

create table public.cafe_members (
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.cafe_member_role not null,
  created_at timestamptz not null default now(),
  primary key (cafe_id, user_id)
);

comment on table public.cafe_members is 'Who may act for a cafe: see bookings of the cafe, cancel them.';

-- The policy below and the bookings policy filter by user_id.
create index cafe_members_user_id_idx on public.cafe_members (user_id);

alter table public.cafe_members enable row level security;

create policy "cafe_members: members see their own rows"
  on public.cafe_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));
