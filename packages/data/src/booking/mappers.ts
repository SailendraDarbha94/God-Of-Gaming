import { AvailabilitySlot, Booking, BookingSource, BookingStatus, StationKind } from '@gog/domain';
import { z } from 'zod';
import { InstantColumn } from '../columns';
import { parseOrThrow } from '../parse';

/**
 * `booking_details` rows (the view `listMine` reads and the type the three RPCs return) and
 * `get_availability` rows to domain objects (spec 04 §Booking queries). The generated types mark
 * every view column nullable, so the row schema states what a real row always carries.
 */

const SeatJson = z.object({
  station_id: z.string(),
  station_label: z.string(),
  released_at: InstantColumn.nullable(),
});

const BookingDetailsRow = z.object({
  id: z.string(),
  cafe_id: z.string(),
  cafe_slug: z.string(),
  cafe_name: z.string(),
  tier_id: z.string(),
  tier_name: z.string(),
  tier_kind: StationKind,
  status: BookingStatus,
  starts_at: InstantColumn,
  ends_at: InstantColumn,
  seat_count: z.number(),
  hourly_rate_paise: z.number(),
  total_paise: z.number(),
  lock_fee_paise: z.number(),
  hold_expires_at: InstantColumn.nullable(),
  source: BookingSource,
  seats: z.array(SeatJson),
  created_at: InstantColumn,
});

const AvailabilityRow = z.object({
  starts_at: InstantColumn,
  free_seats: z.number(),
});

/** The names and the rate are the values copied at hold time, never live catalog values. */
export function toBooking(row: unknown): Booking {
  const r = parseOrThrow(BookingDetailsRow, row, 'booking_details row');
  return parseOrThrow(
    Booking,
    {
      id: r.id,
      cafe: { id: r.cafe_id, slug: r.cafe_slug, name: r.cafe_name },
      tier: { id: r.tier_id, name: r.tier_name, kind: r.tier_kind },
      status: r.status,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      seatCount: r.seat_count,
      hourlyRatePaise: r.hourly_rate_paise,
      totalPaise: r.total_paise,
      lockFeePaise: r.lock_fee_paise,
      holdExpiresAt: r.hold_expires_at,
      source: r.source,
      seats: r.seats.map((seat) => ({
        stationId: seat.station_id,
        stationLabel: seat.station_label,
        releasedAt: seat.released_at,
      })),
      createdAt: r.created_at,
    },
    'Booking',
  );
}

export function toAvailabilitySlot(row: unknown): AvailabilitySlot {
  const r = parseOrThrow(AvailabilityRow, row, 'get_availability row');
  return parseOrThrow(
    AvailabilitySlot,
    { startsAt: r.starts_at, freeSeats: r.free_seats },
    'AvailabilitySlot',
  );
}
