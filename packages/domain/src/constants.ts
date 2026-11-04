import type { Slug } from './scalars';

export const DEFAULT_CITY_SLUG: Slug = 'bengaluru';

/** IST is UTC+05:30 with no daylight saving, so the domain treats it as a fixed offset (ADR 0009). */
export const IST_OFFSET_MINUTES = 330;

/**
 * The booking rules `create_booking` enforces in SQL (spec 03). A pgTAP test and `constants.test.ts`
 * both pin these numbers, so changing one side without the other fails CI.
 */
export const BOOKING_RULES = {
  minMinutes: 30,
  maxMinutes: 360,
  stepMinutes: 30,
  minSeats: 1,
  maxSeats: 10,
  minLeadMinutes: 5,
  maxLeadDays: 30,
  holdMinutes: 10,
  /** Live holds one account may have at once; a fourth `create_booking` is `GG009`. */
  maxLiveHolds: 3,
  /** Upcoming bookings (confirmed or live held) one account may have; the next is `GG009`. */
  maxUpcomingBookings: 10,
} as const;
