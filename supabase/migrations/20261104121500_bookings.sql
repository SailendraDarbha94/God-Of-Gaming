-- bookings (docs/spec/03-database.md, Tables > Bookings; ADR 0005, 0009).
--
-- A booking is a group of seats (booking_seats) of one tier for one time range. Rows are written
-- only by the security-definer functions create_booking, confirm_booking, cancel_booking and
-- expire_holds; there are no insert, update or delete policies.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes (id) on delete restrict,
  tier_id uuid not null references public.station_tiers (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  status public.booking_status not null default 'held',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  seat_count smallint not null check (seat_count between 1 and 10),
  hourly_rate_paise integer not null,
  cafe_slug text not null,
  cafe_name text not null,
  tier_name text not null,
  tier_kind public.station_kind not null,
  total_paise integer not null check (total_paise >= 0),
  lock_fee_paise integer not null default 0,
  hold_expires_at timestamptz,
  source public.booking_source not null default 'app',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_ends_after_starts check (ends_at > starts_at)
);

comment on table public.bookings is
  'A squad booking: seat_count stations of one tier for [starts_at, ends_at). Written only through SQL functions.';
comment on column public.bookings.hourly_rate_paise is
  'Copied from the tier at hold time so later price changes never alter past bookings.';
comment on column public.bookings.cafe_slug is
  'Copied at hold time (with cafe_name, tier_name, tier_kind) so "my bookings" never depends on the live catalog or its RLS.';
comment on column public.bookings.total_paise is
  'round(hourly_rate_paise * minutes / 60) * seat_count, computed in numeric; equals the domain quote().';
comment on column public.bookings.lock_fee_paise is 'Seat Lock fee; always 0 until payments ship.';
comment on column public.bookings.hold_expires_at is
  'Set while status = held (now() + 10 minutes at hold time); null once confirmed.';

create index bookings_user_id_starts_at_idx on public.bookings (user_id, starts_at desc);
create index bookings_cafe_id_starts_at_idx on public.bookings (cafe_id, starts_at);
create index bookings_held_hold_expires_at_idx on public.bookings (hold_expires_at) where status = 'held';

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

create policy "bookings: owner or cafe member can read"
  on public.bookings
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.cafe_members m
      where m.cafe_id = bookings.cafe_id and m.user_id = (select auth.uid())
    )
  );
