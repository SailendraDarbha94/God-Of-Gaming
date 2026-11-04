-- cafes (docs/spec/03-database.md, Tables > Catalog).

create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  name text not null,
  area_id uuid not null references public.areas (id) on delete restrict,
  status public.cafe_status not null default 'draft',
  address_line text not null,
  lat double precision not null,
  lng double precision not null,
  description text not null default '',
  amenities text[] not null default '{}',
  -- E.164 with the leading +; profiles.phone is a different column with GoTrue's digits-only form.
  whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9]\d{6,14}$'),
  maps_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cafes is
  'A gaming cafe. Visible to clients and bookable only while status = live.';
comment on column public.cafes.amenities is
  'Free-form tags such as ac, parking, food, private-room, late-night (see docs/spec/08-sample-data.md).';
comment on column public.cafes.whatsapp is 'E.164 number including the leading +.';

create index cafes_area_id_live_idx on public.cafes (area_id) where status = 'live';

create trigger cafes_set_updated_at
  before update on public.cafes
  for each row execute function public.set_updated_at();

alter table public.cafes enable row level security;

create policy "cafes: live rows are public"
  on public.cafes
  for select
  to anon, authenticated
  using (status = 'live');
