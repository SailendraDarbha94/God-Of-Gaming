-- cities (docs/spec/03-database.md, Tables > Catalog; ADR 0006).

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  name text not null,
  state text not null,
  lat double precision,
  lng double precision,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cities is
  'Cities the product knows about. Bengaluru is live first; the model is multi-city (ADR 0006).';
comment on column public.cities.is_live is
  'When false the city, its areas and its cafe cards are hidden from clients.';

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

alter table public.cities enable row level security;

create policy "cities: live rows are public"
  on public.cities
  for select
  to anon, authenticated
  using (is_live);
