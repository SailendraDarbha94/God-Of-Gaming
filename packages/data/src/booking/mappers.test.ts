import { minutesBetween, quote } from '@gog/domain';
import { describe, expect, it } from 'vitest';
import { DataError } from '../errors';
import { toAvailabilitySlot, toBooking } from './mappers';

/** A `booking_details` row as PostgREST returns it from `create_booking` or the view. */
const HELD_ROW = {
  id: '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c',
  cafe_id: '00000000-0000-4000-8000-000000000301',
  tier_id: '00000000-0000-4000-8000-000000000311',
  user_id: '00000000-0000-4000-8000-919999900001',
  status: 'held',
  starts_at: '2026-11-20T16:30:00+00:00',
  ends_at: '2026-11-20T18:00:00+00:00',
  seat_count: 3,
  hourly_rate_paise: 8025,
  cafe_slug: 'pixel-den-koramangala',
  cafe_name: 'Pixel Den',
  tier_name: 'Standard PC',
  tier_kind: 'pc',
  total_paise: 36114,
  lock_fee_paise: 0,
  hold_expires_at: '2026-11-19T10:10:00+00:00',
  source: 'app',
  created_at: '2026-11-19T10:00:00.25+00:00',
  updated_at: '2026-11-19T10:00:00.25+00:00',
  seats: [
    {
      station_id: '00000000-0000-4000-8000-000000031101',
      station_label: 'STD-01',
      released_at: null,
    },
    {
      station_id: '00000000-0000-4000-8000-000000031102',
      station_label: 'STD-02',
      released_at: null,
    },
    {
      station_id: '00000000-0000-4000-8000-000000031103',
      station_label: 'STD-03',
      released_at: '2026-11-19T10:05:00.123456+00:00',
    },
  ],
};

describe('toBooking', () => {
  it('maps a booking_details row to a Booking with copied names and UTC instants', () => {
    const booking = toBooking(HELD_ROW);
    expect(booking).toEqual({
      id: '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c',
      cafe: {
        id: '00000000-0000-4000-8000-000000000301',
        slug: 'pixel-den-koramangala',
        name: 'Pixel Den',
      },
      tier: { id: '00000000-0000-4000-8000-000000000311', name: 'Standard PC', kind: 'pc' },
      status: 'held',
      startsAt: '2026-11-20T16:30:00Z',
      endsAt: '2026-11-20T18:00:00Z',
      seatCount: 3,
      hourlyRatePaise: 8025,
      totalPaise: 36114,
      lockFeePaise: 0,
      holdExpiresAt: '2026-11-19T10:10:00Z',
      source: 'app',
      seats: [
        {
          stationId: '00000000-0000-4000-8000-000000031101',
          stationLabel: 'STD-01',
          releasedAt: null,
        },
        {
          stationId: '00000000-0000-4000-8000-000000031102',
          stationLabel: 'STD-02',
          releasedAt: null,
        },
        {
          stationId: '00000000-0000-4000-8000-000000031103',
          stationLabel: 'STD-03',
          releasedAt: '2026-11-19T10:05:00.123Z',
        },
      ],
      createdAt: '2026-11-19T10:00:00.250Z',
    });
  });

  it('keeps invariant 2: the total is the quote of the copied rate over the booked range', () => {
    const booking = toBooking(HELD_ROW);
    expect(
      quote({
        hourlyRatePaise: booking.hourlyRatePaise,
        durationMinutes: minutesBetween(booking.startsAt, booking.endsAt),
        seatCount: booking.seatCount,
      }).totalPaise,
    ).toBe(booking.totalPaise);
  });

  it('maps a confirmed booking without a hold expiry and with no seats json', () => {
    expect(
      toBooking({ ...HELD_ROW, status: 'confirmed', hold_expires_at: null, seats: [] }),
    ).toMatchObject({ status: 'confirmed', holdExpiresAt: null, seats: [] });
  });

  it('rejects a view row whose essential columns are null', () => {
    expect(() => toBooking({ ...HELD_ROW, id: null })).toThrow(DataError);
    expect(() => toBooking({ ...HELD_ROW, seats: null })).toThrow(DataError);
    expect(() => toBooking({ ...HELD_ROW, status: 'pending' })).toThrow(DataError);
  });
});

describe('toAvailabilitySlot', () => {
  it('maps a get_availability row', () => {
    expect(toAvailabilitySlot({ starts_at: '2026-11-17T08:30:00+00:00', free_seats: 12 })).toEqual({
      startsAt: '2026-11-17T08:30:00Z',
      freeSeats: 12,
    });
  });

  it('rejects a negative count', () => {
    expect(() =>
      toAvailabilitySlot({ starts_at: '2026-11-17T08:30:00+00:00', free_seats: -1 }),
    ).toThrow(DataError);
  });
});
