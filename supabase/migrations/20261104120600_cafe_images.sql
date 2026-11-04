-- cafe_images (docs/spec/03-database.md, Tables > Catalog).

create table public.cafe_images (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order smallint not null default 0,
  -- Also serves lookups by cafe_id (leading column), so no separate (cafe_id) index.
  unique (cafe_id, sort_order)
);

comment on table public.cafe_images is
  'Gallery images per cafe; the lowest sort_order is the cover. Files live in the cafe-images bucket.';

alter table public.cafe_images enable row level security;

create policy "cafe_images: visible when the cafe is live"
  on public.cafe_images
  for select
  to anon, authenticated
  using (exists (select 1 from public.cafes c where c.id = cafe_images.cafe_id and c.status = 'live'));
