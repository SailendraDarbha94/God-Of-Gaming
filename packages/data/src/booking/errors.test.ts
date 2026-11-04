import { BookingError } from '@gog/domain';
import { PostgrestError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { mapPostgrestError } from './errors';

function failure(code: string, message = `error ${code}`): PostgrestError {
  return new PostgrestError({ message, details: '', hint: '', code });
}

describe('mapPostgrestError', () => {
  it.each([
    ['GG001', 'auth_required'],
    ['GG002', 'invalid_request'],
    ['GG003', 'outside_hours'],
    ['GG004', 'not_enough_seats'],
    ['GG005', 'seat_conflict'],
    ['GG006', 'cafe_not_bookable'],
    ['GG007', 'not_found'],
    ['GG008', 'invalid_state'],
    ['GG009', 'limit_reached'],
  ] as const)('maps SQLSTATE %s to %s', (sqlstate, code) => {
    const error = mapPostgrestError(failure(sqlstate));
    expect(error).toBeInstanceOf(BookingError);
    expect(error.code).toBe(code);
  });

  it('treats a permission error and JWT failures as a missing session', () => {
    for (const code of ['42501', 'PGRST301', 'PGRST302', 'PGRST303']) {
      expect(mapPostgrestError(failure(code)).code).toBe('auth_required');
    }
  });

  it('treats .single() over zero rows as not found', () => {
    expect(mapPostgrestError(failure('PGRST116')).code).toBe('not_found');
  });

  it('maps every other code to unknown and keeps the PostgREST error as cause', () => {
    for (const code of ['P0001', '42P01', 'XX000', 'PGRST100', '']) {
      const cause = failure(code, 'something else');
      const error = mapPostgrestError(cause);
      expect(error.code).toBe('unknown');
      expect(error.cause).toBe(cause);
      expect(error.message).toBe('something else');
    }
  });

  it('marks only seat_conflict as retryable', () => {
    expect(mapPostgrestError(failure('GG005')).retryable).toBe(true);
    for (const code of [
      'GG001',
      'GG002',
      'GG003',
      'GG004',
      'GG006',
      'GG007',
      'GG008',
      'GG009',
      '42501',
    ]) {
      expect(mapPostgrestError(failure(code)).retryable).toBe(false);
    }
  });

  it('accepts the plain error body PostgREST sends, not only PostgrestError instances', () => {
    expect(
      mapPostgrestError({ code: 'GG004', message: 'not enough free seats', details: '', hint: '' })
        .code,
    ).toBe('not_enough_seats');
  });
});
