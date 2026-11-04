import { describe, expect, it } from 'vitest';
import { BookingError, BookingErrorCode } from './errors';

describe('BookingErrorCode', () => {
  it('lists every business failure of the booking flow', () => {
    expect(BookingErrorCode.options).toEqual([
      'auth_required',
      'invalid_request',
      'outside_hours',
      'not_enough_seats',
      'seat_conflict',
      'cafe_not_bookable',
      'not_found',
      'invalid_state',
      'limit_reached',
      'unknown',
    ]);
  });
});

describe('BookingError', () => {
  it('is an Error carrying its code', () => {
    const error = new BookingError('outside_hours');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BookingError);
    expect(error.name).toBe('BookingError');
    expect(error.code).toBe('outside_hours');
    expect(error.message).toBe('outside opening hours');
  });

  it('accepts a message and a cause', () => {
    const cause = new Error('PostgrestError GG005');
    const error = new BookingError('seat_conflict', 'Seats were just taken', { cause });
    expect(error.message).toBe('Seats were just taken');
    expect(error.cause).toBe(cause);
  });

  it.each(BookingErrorCode.options)('%s is retryable only when it is seat_conflict', (code) => {
    expect(new BookingError(code).retryable).toBe(code === 'seat_conflict');
  });
});
