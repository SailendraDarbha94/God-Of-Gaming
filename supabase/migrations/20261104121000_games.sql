-- games (docs/spec/03-database.md, Tables > Catalog).

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 2 and 64),
  name text not null,
  kinds public.station_kind[] not null default '{}'
);

comment on table public.games is 'Catalog of games; kinds lists the station kinds a game runs on.';

alter table public.games enable row level security;

create policy "games: all rows are public"
  on public.games
  for select
  to anon, authenticated
  using (true);
