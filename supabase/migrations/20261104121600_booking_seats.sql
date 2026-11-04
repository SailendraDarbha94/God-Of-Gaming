-- booking_seats (docs/spec/03-database.md, Tables > Bookings; ADR 0005).
--
-- One row per allocated station. The exclusion constraint is the guarantee that two unreleased
-- seats never overlap on one station, whichever client wrote them. Cancelling or expiring sets
-- released_at; rows are never deleted, so history stays intact and the constraint ignores them.

create table public.booking_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  station_id uuid not null references public.stations (id) on delete restrict,
  station_label text not null,
  during tstzrange not null check (not isempty(during)),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  -- Also serves lookups by booking_id (leading column), so no separate (booking_id) index.
  unique (booking_id, station_id),
  constraint booking_seats_no_overlap
    exclude using gist (station_id with =, during with &&) where (released_at is null)
);

comment on table public.booking_seats is
  'Allocated stations of a booking; during = [starts_at, ends_at). Unreleased seats of one station never overlap.';
comment on column public.booking_seats.station_label is 'Copied from the station at hold time.';
comment on column public.booking_seats.released_at is
  'Set when the booking is cancelled or expired; released rows are ignored by the exclusion constraint.';

alter table public.booking_seats enable row level security;

-- bookings has its own select policy, so this subquery only finds bookings the caller may see.
create policy "booking_seats: visible with the parent booking"
  on public.booking_seats
  for select
  to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_seats.booking_id));
