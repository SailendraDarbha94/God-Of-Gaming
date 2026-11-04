-- cafe_games (docs/spec/03-database.md, Tables > Catalog).

create table public.cafe_games (
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  primary key (cafe_id, game_id)
);

comment on table public.cafe_games is 'Which games a cafe offers.';

create index cafe_games_game_id_idx on public.cafe_games (game_id);

alter table public.cafe_games enable row level security;

create policy "cafe_games: visible when the cafe is live"
  on public.cafe_games
  for select
  to anon, authenticated
  using (exists (select 1 from public.cafes c where c.id = cafe_games.cafe_id and c.status = 'live'));
