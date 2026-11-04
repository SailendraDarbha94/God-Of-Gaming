-- booking_details (docs/spec/03-database.md, Views). bookings plus its seats as jsonb; the only
-- shape clients read bookings in, and the return type of create_booking, confirm_booking and
-- cancel_booking (no second fetch after a hold, confirm or cancel).
--
-- security_invoker: direct reads are filtered by the bookings and booking_seats policies; inside
-- the security-definer functions the owner reads it unrestricted. Clients never embed cafes,
-- station_tiers or stations from bookings: those tables' own RLS would null out refs to paused
-- cafes or retired stations, which is why the names are copied into bookings at hold time.
create view public.booking_details
with (security_invoker = true)
as
select
  b.*,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'station_id', bs.station_id,
          'station_label', bs.station_label,
          'released_at', bs.released_at
        )
        order by bs.station_label
      )
      from public.booking_seats bs
      where bs.booking_id = b.id
    ),
    '[]'::jsonb
  ) as seats
from public.bookings b;

comment on view public.booking_details is
  'bookings.* plus seats: [{station_id, station_label, released_at}] ordered by label.';
