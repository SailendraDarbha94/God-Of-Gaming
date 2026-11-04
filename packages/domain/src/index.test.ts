import { describe, expect, it } from 'vitest';
import * as domain from './index';

/**
 * The runtime surface of the package, pinned so that a renamed or forgotten re-export is caught.
 * Types are not listed: they have no runtime presence.
 */
const PUBLIC_VALUES = [
  // scalars
  'Uuid',
  'Slug',
  'IsoInstant',
  'LocalDate',
  'HHMM',
  'Paise',
  'Minutes',
  'Weekday',
  // enums
  'StationKind',
  'CafeStatus',
  'BookingStatus',
  'BookingSource',
  'STATION_KIND_LABELS',
  'AMENITY_LABELS',
  'amenityLabel',
  // entities
  'City',
  'Area',
  'OpeningHours',
  'StationTier',
  'Game',
  'CafeImage',
  'CafeRef',
  'PlaceRef',
  'CafeCard',
  'Cafe',
  'Promotion',
  'Profile',
  'isBookable',
  'mapsUrlFor',
  // booking
  'AvailabilitySlot',
  'AvailabilityRequest',
  'BookingRequest',
  'BookingSeat',
  'Booking',
  'validateBookingRequest',
  'quote',
  'holdExpiresAt',
  'canTransition',
  // errors
  'BookingErrorCode',
  'BookingError',
  // result
  'ok',
  'err',
  // constants
  'DEFAULT_CITY_SLUG',
  'IST_OFFSET_MINUTES',
  'BOOKING_RULES',
  // time
  'istToInstant',
  'instantToIst',
  'parseHHMM',
  'formatHHMM',
  'addMinutes',
  'minutesBetween',
  'weekdayOf',
  'addDays',
  'formatWeekday',
  'formatWallClockTime',
  'formatIstTime',
  'formatIstDate',
  // hours
  'openingWindowFor',
  'isOpenDuring',
  'slotStarts',
  'groupHoursForDisplay',
  // money
  'formatPaise',
  'formatHourlyRate',
  // counts
  'formatCount',
  // slug
  'slugify',
];

describe('@gog/domain public surface', () => {
  it('re-exports exactly the documented values', () => {
    expect(Object.keys(domain).sort()).toEqual([...PUBLIC_VALUES].sort());
  });

  it('exports every spec 02 function as a function', () => {
    const functions = [
      'amenityLabel',
      'isBookable',
      'mapsUrlFor',
      'validateBookingRequest',
      'quote',
      'holdExpiresAt',
      'canTransition',
      'ok',
      'err',
      'istToInstant',
      'instantToIst',
      'parseHHMM',
      'formatHHMM',
      'addMinutes',
      'minutesBetween',
      'weekdayOf',
      'addDays',
      'formatIstTime',
      'formatIstDate',
      'openingWindowFor',
      'isOpenDuring',
      'slotStarts',
      'groupHoursForDisplay',
      'formatPaise',
      'formatHourlyRate',
      'formatCount',
      'slugify',
    ] as const;
    for (const name of functions) {
      expect(typeof domain[name]).toBe('function');
    }
  });
});
