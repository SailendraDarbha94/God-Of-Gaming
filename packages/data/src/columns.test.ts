import { describe, expect, it } from 'vitest';
import { InstantColumn, instantFromEpochMs, TimeColumn } from './columns';

describe('instantFromEpochMs', () => {
  it('drops zero milliseconds and keeps non-zero ones', () => {
    expect(instantFromEpochMs(Date.UTC(2026, 10, 20, 16, 30))).toBe('2026-11-20T16:30:00Z');
    expect(instantFromEpochMs(Date.UTC(2026, 10, 20, 16, 30, 0, 250))).toBe(
      '2026-11-20T16:30:00.250Z',
    );
  });
});

describe('InstantColumn', () => {
  it('normalises the +00:00 form Postgres renders to Z', () => {
    expect(InstantColumn.parse('2026-11-19T12:30:00+00:00')).toBe('2026-11-19T12:30:00Z');
  });

  it('converts an offset instant to UTC', () => {
    expect(InstantColumn.parse('2026-11-19T18:00:00+05:30')).toBe('2026-11-19T12:30:00Z');
  });

  it('keeps milliseconds and truncates microseconds', () => {
    expect(InstantColumn.parse('2026-11-19T10:00:00.25+00:00')).toBe('2026-11-19T10:00:00.250Z');
    expect(InstantColumn.parse('2026-11-19T10:00:00.123456+00:00')).toBe(
      '2026-11-19T10:00:00.123Z',
    );
  });

  it('rejects anything Date cannot parse', () => {
    expect(InstantColumn.safeParse('yesterday').success).toBe(false);
    expect(InstantColumn.safeParse(1_700_000_000).success).toBe(false);
  });
});

describe('TimeColumn', () => {
  it('reduces HH:MM:SS to HH:MM', () => {
    expect(TimeColumn.parse('10:00:00')).toBe('10:00');
    expect(TimeColumn.parse('23:30')).toBe('23:30');
    expect(TimeColumn.parse('02:00:00.5')).toBe('02:00');
  });

  it('rejects values outside a day', () => {
    expect(TimeColumn.safeParse('24:00:00').success).toBe(false);
    expect(TimeColumn.safeParse('10:60').success).toBe(false);
    expect(TimeColumn.safeParse('noon').success).toBe(false);
  });
});
