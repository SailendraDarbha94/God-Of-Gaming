import { describe, expect, it } from 'vitest';
import { HHMM, IsoInstant, LocalDate, Minutes, Paise, Slug, Uuid, Weekday } from './scalars';

describe('Uuid', () => {
  it.each(['00000000-0000-4000-8000-000000000301', '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c'])(
    'accepts %s',
    (value) => {
      expect(Uuid.safeParse(value).success).toBe(true);
    },
  );

  it.each([
    '',
    'not-a-uuid',
    '00000000-0000-4000-8000-00000000030',
    '00000000-0000-4000-8000-0000000003011',
    'zzzzzzzz-0000-4000-8000-000000000301',
  ])('rejects %j', (value) => {
    expect(Uuid.safeParse(value).success).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(Uuid.safeParse(42).success).toBe(false);
    expect(Uuid.safeParse(null).success).toBe(false);
  });
});

describe('Slug', () => {
  it.each(['bengaluru', 'hsr-layout', 'ab', 'a1-b2-c3', 'gta-vi', 'a'.repeat(64)])(
    'accepts %s',
    (value) => {
      expect(Slug.safeParse(value).success).toBe(true);
    },
  );

  it.each(['', 'a', 'Pixel', 'a--b', '-a', 'a-', 'a_b', 'a b', 'café', 'a'.repeat(65)])(
    'rejects %j',
    (value) => {
      expect(Slug.safeParse(value).success).toBe(false);
    },
  );
});

describe('IsoInstant', () => {
  it.each([
    '2026-11-20T16:30:00Z',
    '2026-11-20T16:30:00.000Z',
    '2026-11-20T16:30:00.123456Z',
    '2026-11-20T22:00:00+05:30',
    '2026-11-20T22:00:00+00:00',
  ])('accepts %s', (value) => {
    expect(IsoInstant.safeParse(value).success).toBe(true);
  });

  it.each(['2026-11-20T16:30:00', '2026-11-20 16:30:00Z', '2026-11-20', '16:30', 'garbage', ''])(
    'rejects %j',
    (value) => {
      expect(IsoInstant.safeParse(value).success).toBe(false);
    },
  );
});

describe('LocalDate', () => {
  it.each(['2026-11-20', '2028-02-29', '2026-01-01', '2026-12-31'])('accepts %s', (value) => {
    expect(LocalDate.safeParse(value).success).toBe(true);
  });

  it.each([
    '2026-02-29',
    '2026-13-01',
    '2026-11-32',
    '2026-11-00',
    '20261120',
    '2026-11-20T00:00:00Z',
    '26-11-20',
    '',
  ])('rejects %j', (value) => {
    expect(LocalDate.safeParse(value).success).toBe(false);
  });
});

describe('HHMM', () => {
  it.each(['00:00', '09:05', '10:00', '19:30', '23:59'])('accepts %s', (value) => {
    expect(HHMM.safeParse(value).success).toBe(true);
  });

  it.each(['24:00', '9:00', '10:60', '10:00:00', '1000', '10-00', ''])('rejects %j', (value) => {
    expect(HHMM.safeParse(value).success).toBe(false);
  });
});

describe('Paise', () => {
  it.each([0, 8025, 12_000, 1_000_000_000])('accepts %d', (value) => {
    expect(Paise.safeParse(value).success).toBe(true);
  });

  it('rejects negatives, fractions and strings', () => {
    expect(Paise.safeParse(-1).success).toBe(false);
    expect(Paise.safeParse(1.5).success).toBe(false);
    expect(Paise.safeParse('100').success).toBe(false);
    expect(Paise.safeParse(Number.NaN).success).toBe(false);
  });
});

describe('Minutes', () => {
  it('accepts whole numbers of either sign', () => {
    expect(Minutes.safeParse(30).success).toBe(true);
    expect(Minutes.safeParse(0).success).toBe(true);
    expect(Minutes.safeParse(-30).success).toBe(true);
  });

  it('rejects fractions and strings', () => {
    expect(Minutes.safeParse(1.5).success).toBe(false);
    expect(Minutes.safeParse('30').success).toBe(false);
  });
});

describe('Weekday', () => {
  it.each([0, 1, 2, 3, 4, 5, 6])('accepts %d', (value) => {
    expect(Weekday.safeParse(value).success).toBe(true);
  });

  it.each([-1, 7, 1.5, '0'])('rejects %j', (value) => {
    expect(Weekday.safeParse(value).success).toBe(false);
  });
});
