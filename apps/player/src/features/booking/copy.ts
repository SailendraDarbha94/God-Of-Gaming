import {
  BOOKING_RULES,
  BookingError,
  formatPaise,
  type Booking,
  type BookingErrorCode,
  type BookingStatus,
  type Paise,
} from '@gog/domain';

import { formatRatePerHour } from '../../lib/format';

/** User-facing copy for each business failure of the booking flow (spec 06 §Errors). */
export const BOOKING_ERROR_COPY: Readonly<Record<BookingErrorCode, string>> = {
  auth_required: 'Sign in to hold seats.',
  invalid_request: `Pick a start at least ${BOOKING_RULES.minLeadMinutes} minutes from now and within ${BOOKING_RULES.maxLeadDays} days.`,
  outside_hours: 'The cafe is closed for part of that time. Pick another slot.',
  not_enough_seats: 'Not enough free seats at that time. Try fewer seats or another slot.',
  // seat_conflict is retried once by the data layer; this shows only when the retry failed too.
  seat_conflict: 'Those seats were just taken, pick another time.',
  cafe_not_bookable: 'This cafe is not taking bookings right now.',
  not_found: 'We could not find that booking.',
  invalid_state: 'This booking can no longer be changed.',
  limit_reached: `You already have ${BOOKING_RULES.maxLiveHolds} holds or ${BOOKING_RULES.maxUpcomingBookings} upcoming bookings. Confirm or cancel one to hold more.`,
  unknown: 'Something went wrong. Please try again.',
};

export function bookingErrorMessage(error: unknown): string {
  return error instanceof BookingError
    ? BOOKING_ERROR_COPY[error.code]
    : BOOKING_ERROR_COPY.unknown;
}

export const BOOKING_STATUS_LABELS: Readonly<Record<BookingStatus, string>> = {
  held: 'On hold',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  expired: 'Hold expired',
  completed: 'Completed',
  no_show: 'No-show',
};

/** What the cancel action is called, on the list card and on the detail screen alike. */
export const BOOKING_CANCEL_LABELS: Readonly<Record<'held' | 'confirmed', string>> = {
  held: 'Release seats',
  confirmed: 'Cancel booking',
};

/** The prompt before a confirmed session is cancelled; releasing a hold asks nothing. */
export const CANCEL_CONFIRMATION = {
  title: 'Cancel this booking?',
  message: 'Your seats go back on sale.',
  keep: 'Keep it',
} as const;

/** Shown on the hold screen when the rate changed between the review step and the hold. */
export function rateChangedNotice(quotedPaise: Paise, booking: Booking): string {
  return `The rate changed while you were choosing: this hold is ${formatPaise(booking.totalPaise)} at ${formatRatePerHour(booking.hourlyRatePaise)} per seat, not the ${formatPaise(quotedPaise)} you saw.`;
}
