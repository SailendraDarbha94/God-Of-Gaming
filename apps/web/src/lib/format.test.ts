import { describe, expect, it } from 'vitest';

import {
  amenityLabel,
  bookingLimits,
  formatCafeCount,
  formatFromRate,
  formatHourlyRate,
  formatPromotionWindow,
  formatSpecs,
  formatStationCount,
  isStationKind,
  stationKindLabel,
  stationKinds,
} from '@/lib/format';

describe('formatHourlyRate', () => {
  it('formats whole rupees per hour', () => {
    expect(formatHourlyRate(8000)).toBe('₹80/hr');
  });

  it('keeps paise when the rate has them', () => {
    expect(formatHourlyRate(6250)).toBe('₹62.50/hr');
  });

  it('groups thousands with en-IN grouping', () => {
    expect(formatHourlyRate(125000)).toBe('₹1,250/hr');
  });
});

describe('formatFromRate', () => {
  it('prefixes the cheapest rate with "From"', () => {
    expect(formatFromRate(7000)).toBe('From ₹70/hr');
  });

  it('points to the app when a cafe has no priced tier', () => {
    expect(formatFromRate(null)).toBe('Prices in the app');
  });
});

describe('formatStationCount', () => {
  it('uses the singular for one station', () => {
    expect(formatStationCount(1)).toBe('1 station');
  });

  it('uses the plural otherwise', () => {
    expect(formatStationCount(12)).toBe('12 stations');
    expect(formatStationCount(0)).toBe('0 stations');
  });
});

describe('formatCafeCount', () => {
  it('counts cafes', () => {
    expect(formatCafeCount(1)).toBe('1 cafe');
    expect(formatCafeCount(6)).toBe('6 cafes');
  });
});

describe('bookingLimits', () => {
  it('reads the squad limit and hold window from the domain rules', () => {
    expect(bookingLimits).toEqual({ maxSeats: 10, holdMinutes: 10 });
  });
});

describe('station kinds', () => {
  it('labels kinds with the domain names', () => {
    expect(stationKindLabel('ps5')).toBe('PlayStation 5');
    expect(stationKindLabel('sim_racing')).toBe('Sim racing');
  });

  it('lists every kind once', () => {
    expect(stationKinds()).toEqual(['pc', 'ps5', 'xbox', 'switch', 'vr', 'sim_racing', 'other']);
  });

  it('narrows URL input to real kinds only', () => {
    expect(isStationKind('pc')).toBe(true);
    expect(isStationKind('laptop')).toBe(false);
    expect(isStationKind('constructor')).toBe(false);
    expect(isStationKind('toString')).toBe(false);
  });
});

describe('formatPromotionWindow', () => {
  it('shows both dates when a window crosses midnight IST', () => {
    // GTA VI launch night: 19 Nov 18:00 IST to 20 Nov 02:00 IST (08-sample-data.md).
    expect(formatPromotionWindow('2026-11-19T12:30:00Z', '2026-11-19T20:30:00Z')).toBe(
      'Thu, 19 Nov, 6:00 pm – Fri, 20 Nov, 2:00 am IST',
    );
  });

  it('shows the date once for a same-day window', () => {
    expect(formatPromotionWindow('2026-12-05T05:30:00Z', '2026-12-05T16:30:00Z')).toBe(
      'Sat, 5 Dec, 11:00 am – 10:00 pm IST',
    );
  });

  it('reads "From" when the promotion has no end', () => {
    expect(formatPromotionWindow('2026-11-04T04:30:00Z', null)).toBe(
      'From Wed, 4 Nov, 10:00 am IST',
    );
  });

  it('prints dates only for a whole-day campaign', () => {
    // Squad Saturdays: 7 Nov 00:00 IST to 31 Jan 23:59 IST (08-sample-data.md).
    expect(formatPromotionWindow('2026-11-06T18:30:00Z', '2027-01-31T18:29:00Z')).toBe(
      'Sat, 7 Nov – Sun, 31 Jan',
    );
    // Late-night PC rates: from 4 Nov 00:00 IST, no end.
    expect(formatPromotionWindow('2026-11-03T18:30:00Z', null)).toBe('From Wed, 4 Nov');
  });

  it('keeps the times when only one end is on a day boundary', () => {
    expect(formatPromotionWindow('2026-11-06T18:30:00Z', '2026-11-07T06:30:00Z')).toBe(
      'Sat, 7 Nov, 12:00 am – 12:00 pm IST',
    );
  });
});

describe('formatSpecs', () => {
  it('joins the values with a middle dot', () => {
    expect(formatSpecs({ gpu: 'RTX 4060', refresh: '165 Hz' })).toBe('RTX 4060 · 165 Hz');
  });

  it('is empty for no specs', () => {
    expect(formatSpecs({})).toBe('');
  });
});

describe('amenityLabel', () => {
  it('labels the known amenities', () => {
    expect(amenityLabel('ac')).toBe('Air conditioning');
    expect(amenityLabel('private-room')).toBe('Private room');
    expect(amenityLabel('late-night')).toBe('Open late');
  });

  it('turns an unknown slug into words', () => {
    expect(amenityLabel('rooftop-seating')).toBe('Rooftop seating');
  });
});
