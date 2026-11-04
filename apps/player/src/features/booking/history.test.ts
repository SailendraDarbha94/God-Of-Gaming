import type { Booking } from '@gog/domain';
import { describe, expect, it } from 'vitest';

import { effectiveStatus, hasLapsed, isCancellable, splitBookings } from './history';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: '00000000-0000-4000-8000-000000900001',
    cafe: {
      id: '00000000-0000-4000-8000-000000000301',
      slug: 'pixel-den-koramangala',
      name: 'Pixel Den',
    },
    tier: { id: '00000000-0000-4000-8000-000000000311', name: 'Standard PC', kind: 'pc' },
    status: 'confirmed',
    startsAt: '2026-11-13T08:30:00Z',
    endsAt: '2026-11-13T09:30:00Z',
    seatCount: 1,
    hourlyRatePaise: 8000,
    totalPaise: 8000,
    lockFeePaise: 0,
    holdExpiresAt: null,
    source: 'app',
    seats: [],
    createdAt: '2026-11-13T07:00:00Z',
    ...overrides,
  };
}

const LIVE_HOLD = booking({
  id: '00000000-0000-4000-8000-000000900002',
  status: 'held',
  holdExpiresAt: '2026-11-13T07:10:00Z',
});

describe('hasLapsed and effectiveStatus', () => {
  it('reads a hold as expired once its timer has run out, before the server sweeps it', () => {
    expect(hasLapsed(LIVE_HOLD, '2026-11-13T07:09:59Z')).toBe(false);
    expect(effectiveStatus(LIVE_HOLD, '2026-11-13T07:09:59Z')).toBe('held');
    expect(hasLapsed(LIVE_HOLD, '2026-11-13T07:10:00Z')).toBe(true);
    expect(effectiveStatus(LIVE_HOLD, '2026-11-13T07:10:00Z')).toBe('expired');
  });

  it('leaves every other status alone', () => {
    const confirmed = booking();
    expect(hasLapsed(confirmed, '2026-11-20T00:00:00Z')).toBe(false);
    expect(effectiveStatus(confirmed, '2026-11-20T00:00:00Z')).toBe('confirmed');
    expect(effectiveStatus(booking({ status: 'cancelled' }), '2026-11-13T07:00:00Z')).toBe(
      'cancelled',
    );
  });
});

describe('isCancellable', () => {
  it('allows a live hold and an upcoming confirmed session', () => {
    expect(isCancellable(LIVE_HOLD, '2026-11-13T07:05:00Z')).toBe(true);
    expect(isCancellable(booking(), '2026-11-13T07:05:00Z')).toBe(true);
  });

  it('refuses a lapsed hold, an ended session and terminal states', () => {
    expect(isCancellable(LIVE_HOLD, '2026-11-13T07:10:00Z')).toBe(false);
    expect(isCancellable(booking(), '2026-11-13T09:30:00Z')).toBe(false);
    expect(isCancellable(booking({ status: 'cancelled' }), '2026-11-13T07:05:00Z')).toBe(false);
    expect(isCancellable(booking({ status: 'expired' }), '2026-11-13T07:05:00Z')).toBe(false);
  });
});

describe('splitBookings', () => {
  it('compares instants as numbers, so a session that ended this second is past', () => {
    const ended = booking();
    expect(splitBookings([ended], '2026-11-13T09:30:00.999Z').past).toEqual([ended]);
    expect(splitBookings([ended], '2026-11-13T09:29:59.500Z').upcoming).toEqual([ended]);
  });

  it('files a lapsed hold under past', () => {
    expect(splitBookings([LIVE_HOLD], '2026-11-13T07:10:00Z').past).toEqual([LIVE_HOLD]);
    expect(splitBookings([LIVE_HOLD], '2026-11-13T07:09:59Z').upcoming).toEqual([LIVE_HOLD]);
  });

  it('orders upcoming soonest first and keeps the list order for past', () => {
    const later = booking({
      id: '00000000-0000-4000-8000-000000900003',
      startsAt: '2026-11-14T08:30:00Z',
      endsAt: '2026-11-14T09:30:00Z',
    });
    const sooner = booking({ id: '00000000-0000-4000-8000-000000900004' });
    const cancelled = booking({ id: '00000000-0000-4000-8000-000000900005', status: 'cancelled' });
    const expired = booking({ id: '00000000-0000-4000-8000-000000900006', status: 'expired' });
    const { upcoming, past } = splitBookings(
      [later, cancelled, sooner, expired],
      '2026-11-13T07:00:00Z',
    );
    expect(upcoming.map((item) => item.id)).toEqual([sooner.id, later.id]);
    expect(past.map((item) => item.id)).toEqual([cancelled.id, expired.id]);
  });
});
