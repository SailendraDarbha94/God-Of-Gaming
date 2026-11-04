-- areas (docs/spec/03-database.md, Tables > Catalog).

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete restrict,
  slug text not null
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Also serves lookups by city_id (leading column), so no separate (city_id) index.
  unique (city_id, slug)
);

comment on table public.areas is 'Neighbourhoods inside a city; cafes belong to one area.';

create trigger areas_set_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

alter table public.areas enable row level security;

create policy "areas: visible when the city is live"
  on public.areas
  for select
  to anon, authenticated
  using (exists (select 1 from public.cities c where c.id = areas.city_id and c.is_live));
