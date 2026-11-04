-- stations (docs/spec/03-database.md, Tables > Catalog).

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.station_tiers (id) on delete cascade,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Also serves lookups by tier_id (leading column); a tier has at most a few dozen stations,
  -- so no separate partial (tier_id) where is_active index.
  unique (tier_id, label)
);

comment on table public.stations is
  'One bookable seat (a PC, a console, a rig). Inactive stations are hidden and never allocated.';
comment on column public.stations.label is 'Per-tier prefix plus two digits (STD-01, PS5-03); copied into booking_seats at hold time.';

create trigger stations_set_updated_at
  before update on public.stations
  for each row execute function public.set_updated_at();

alter table public.stations enable row level security;

create policy "stations: active rows visible when the cafe is live"
  on public.stations
  for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1
      from public.station_tiers t
      join public.cafes c on c.id = t.cafe_id
      where t.id = stations.tier_id and c.status = 'live'
    )
  );
