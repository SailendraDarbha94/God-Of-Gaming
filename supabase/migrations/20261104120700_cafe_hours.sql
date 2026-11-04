-- cafe_hours (docs/spec/03-database.md, Tables > Catalog; ADR 0009).

create table public.cafe_hours (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_overnight boolean not null default false,
  -- Also serves lookups by cafe_id (leading column), so no separate (cafe_id) index.
  unique (cafe_id, weekday),
  constraint cafe_hours_close_after_open
    check (case when is_overnight then closes_at <= opens_at else closes_at > opens_at end)
);

comment on table public.cafe_hours is
  'Opening hours per weekday as IST wall-clock times; a missing weekday means closed that day.';
comment on column public.cafe_hours.weekday is '0 = Sunday ... 6 = Saturday, as in extract(dow) and Date#getDay().';
comment on column public.cafe_hours.is_overnight is
  'Overnight rows close on the next calendar day at or before the opening time; 00:00-00:00 overnight is a 24-hour day.';

alter table public.cafe_hours enable row level security;

create policy "cafe_hours: visible when the cafe is live"
  on public.cafe_hours
  for select
  to anon, authenticated
  using (exists (select 1 from public.cafes c where c.id = cafe_hours.cafe_id and c.status = 'live'));
