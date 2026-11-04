-- station_tiers (docs/spec/03-database.md, Tables > Catalog; ADR 0009 for paise).

create table public.station_tiers (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  kind public.station_kind not null,
  name text not null,
  description text,
  hourly_rate_paise integer not null check (hourly_rate_paise > 0),
  specs jsonb not null default '{}',
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Also serves lookups by cafe_id (leading column), so no separate (cafe_id) index.
  unique (cafe_id, name)
);

comment on table public.station_tiers is
  'A priced group of identical stations ("Standard PC Rs 80/hr"). Bookings allocate stations of one tier.';
comment on column public.station_tiers.hourly_rate_paise is 'Price per station per hour in integer paise.';
comment on column public.station_tiers.specs is 'Flat object of display specs, string values only (gpu, refresh_rate, display, ...).';

create trigger station_tiers_set_updated_at
  before update on public.station_tiers
  for each row execute function public.set_updated_at();

alter table public.station_tiers enable row level security;

create policy "station_tiers: visible when the cafe is live"
  on public.station_tiers
  for select
  to anon, authenticated
  using (exists (select 1 from public.cafes c where c.id = station_tiers.cafe_id and c.status = 'live'));
