import { describe, expect, it } from 'vitest';
import {
  AMENITY_LABELS,
  amenityLabel,
  BookingSource,
  BookingStatus,
  CafeStatus,
  STATION_KIND_LABELS,
  StationKind,
} from './enums';

describe('enums', () => {
  it('StationKind lists the market kinds plus a catch-all', () => {
    expect(StationKind.options).toEqual([
      'pc',
      'ps5',
      'xbox',
      'switch',
      'vr',
      'sim_racing',
      'other',
    ]);
    expect(StationKind.safeParse('ps5').success).toBe(true);
    expect(StationKind.safeParse('ps4').success).toBe(false);
  });

  it('CafeStatus is draft, live or paused', () => {
    expect(CafeStatus.options).toEqual(['draft', 'live', 'paused']);
    expect(CafeStatus.safeParse('closed').success).toBe(false);
  });

  it('BookingStatus has the six states the database knows', () => {
    expect(BookingStatus.options).toEqual([
      'held',
      'confirmed',
      'cancelled',
      'expired',
      'completed',
      'no_show',
    ]);
    expect(BookingStatus.safeParse('pending').success).toBe(false);
  });

  it('BookingSource is app or counter', () => {
    expect(BookingSource.options).toEqual(['app', 'counter']);
    expect(BookingSource.safeParse('web').success).toBe(false);
  });
});

describe('STATION_KIND_LABELS', () => {
  it('has exactly one label per kind', () => {
    expect(Object.keys(STATION_KIND_LABELS).sort()).toEqual([...StationKind.options].sort());
  });

  it.each([
    ['pc', 'PC'],
    ['ps5', 'PlayStation 5'],
    ['xbox', 'Xbox'],
    ['switch', 'Nintendo Switch'],
    ['vr', 'VR'],
    ['sim_racing', 'Sim racing'],
    ['other', 'Other'],
  ] as const)('labels %s as %s', (kind, label) => {
    expect(STATION_KIND_LABELS[kind]).toBe(label);
  });
});

describe('AMENITY_LABELS', () => {
  it('covers exactly the nine amenity slugs of spec 08', () => {
    expect(Object.keys(AMENITY_LABELS).sort()).toEqual([
      'ac',
      'cafe',
      'food',
      'late-night',
      'parking',
      'private-room',
      'streaming-setup',
      'tournament-ready',
      'wheelchair-access',
    ]);
  });

  it.each([
    ['ac', 'Air conditioning'],
    ['parking', 'Parking'],
    ['food', 'Food'],
    ['cafe', 'Cafe'],
    ['private-room', 'Private room'],
    ['streaming-setup', 'Streaming setup'],
    ['tournament-ready', 'Tournament ready'],
    ['wheelchair-access', 'Wheelchair access'],
    ['late-night', 'Open late'],
  ])('labels %s as %s', (slug, label) => {
    expect(AMENITY_LABELS[slug]).toBe(label);
    expect(amenityLabel(slug)).toBe(label);
  });

  it('turns an unknown slug into words', () => {
    expect(amenityLabel('rooftop-seating')).toBe('Rooftop seating');
    expect(amenityLabel('constructor')).toBe('Constructor');
  });
});
