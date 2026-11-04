import { describe, expect, it } from 'vitest';
import { Slug } from './scalars';
import { slugify } from './slug';

describe('slugify', () => {
  it.each([
    ['Pixel Den Koramangala', 'pixel-den-koramangala'],
    ['  Frame   Rate!!  ', 'frame-rate'],
    ['Café Über', 'cafe-uber'],
    ["Rohan's Den", 'rohans-den'],
    ['Rohan’s Den', 'rohans-den'],
    ['GTA VI – Launch Night', 'gta-vi-launch-night'],
    ['EA Sports FC 26', 'ea-sports-fc-26'],
    ['hsr-layout', 'hsr-layout'],
    ['Counter-Strike 2', 'counter-strike-2'],
    ['100 Feet Road, Indiranagar', '100-feet-road-indiranagar'],
    ['Overclock_Lounge', 'overclock-lounge'],
  ])('turns %j into %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
    expect(Slug.safeParse(slugify(input)).success).toBe(true);
  });

  it('cuts long names to 64 characters without a dangling dash', () => {
    const long = slugify(`${'word '.repeat(20)}end`);
    expect(long.length).toBeLessThanOrEqual(64);
    expect(long.endsWith('-')).toBe(false);
    expect(Slug.safeParse(long).success).toBe(true);
    expect(slugify('a'.repeat(70))).toBe('a'.repeat(64));
  });

  it('returns an empty string when nothing survives', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!!')).toBe('');
  });
});
