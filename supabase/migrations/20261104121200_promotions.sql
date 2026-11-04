-- promotions (docs/spec/03-database.md, Tables > Catalog). Events and offers shown on the
-- website (/events) and in the app; a promotion may belong to a cafe, a city, both or neither.

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  title text not null,
  summary text not null,
  body text not null default '',
  image_url text,
  cafe_id uuid references public.cafes (id) on delete set null,
  city_id uuid references public.cities (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cta_label text,
  cta_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_ends_after_starts check (ends_at is null or ends_at > starts_at)
);

comment on column public.promotions.body is 'Markdown.';
comment on column public.promotions.ends_at is 'Null means open-ended.';
comment on column public.promotions.cta_url is 'Absolute URL, site-relative path (/cafes) or app scheme link (gog://cafe/<slug>).';

create index promotions_published_starts_at_idx on public.promotions (is_published, starts_at);

create trigger promotions_set_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

alter table public.promotions enable row level security;

create policy "promotions: published rows are public"
  on public.promotions
  for select
  to anon, authenticated
  using (is_published);
