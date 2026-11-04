import { describe, expect, it } from 'vitest';
import { formatCount } from './counts';

describe('formatCount', () => {
  it('uses the singular for exactly one', () => {
    expect(formatCount(1, 'seat')).toBe('1 seat');
    expect(formatCount(1, 'station')).toBe('1 station');
  });

  it('uses the plural otherwise, including zero', () => {
    expect(formatCount(0, 'station')).toBe('0 stations');
    expect(formatCount(12, 'station')).toBe('12 stations');
    expect(formatCount(6, 'cafe')).toBe('6 cafes');
  });

  it('takes an irregular plural', () => {
    expect(formatCount(2, 'person', 'people')).toBe('2 people');
  });
});
