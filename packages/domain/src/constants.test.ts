import { describe, expect, it } from 'vitest';
import { BOOKING_RULES, DEFAULT_CITY_SLUG, IST_OFFSET_MINUTES } from './constants';
import { Slug } from './scalars';

describe('constants', () => {
  it('launches in Bengaluru', () => {
    expect(DEFAULT_CITY_SLUG).toBe('bengaluru');
    expect(Slug.safeParse(DEFAULT_CITY_SLUG).success).toBe(true);
  });

  it('treats IST as a fixed +05:30 offset', () => {
    expect(IST_OFFSET_MINUTES).toBe(330);
  });

  // Pinned on purpose: `create_booking` in SQL enforces the same numbers and pgTAP pins them too, so
  // changing one side without the other fails CI (spec 02 §Constants).
  it('pins the booking rules shared with create_booking', () => {
    expect(BOOKING_RULES).toEqual({
      minMinutes: 30,
      maxMinutes: 360,
      stepMinutes: 30,
      minSeats: 1,
      maxSeats: 10,
      minLeadMinutes: 5,
      maxLeadDays: 30,
      holdMinutes: 10,
      maxLiveHolds: 3,
      maxUpcomingBookings: 10,
    });
  });
});
