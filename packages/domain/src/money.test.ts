import { describe, expect, it } from 'vitest';
import { formatHourlyRate, formatPaise } from './money';

describe('formatPaise', () => {
  it.each([
    [0, '₹0'],
    [5, '₹0.05'],
    [50, '₹0.50'],
    [100, '₹1'],
    [8000, '₹80'],
    [12_000, '₹120'],
    [6250, '₹62.50'],
    [4013, '₹40.13'],
    [125_000, '₹1,250'],
    [99_999, '₹999.99'],
  ])('formats %d paise as %s', (paise, expected) => {
    expect(formatPaise(paise)).toBe(expected);
  });

  it('groups rupees in lakhs and crores', () => {
    expect(formatPaise(10_000_000)).toBe('₹1,00,000');
    expect(formatPaise(12_500_000)).toBe('₹1,25,000');
    expect(formatPaise(1_250_000_000)).toBe('₹1,25,00,000');
    expect(formatPaise(100_000_005)).toBe('₹10,00,000.05');
  });

  it('can always show paise', () => {
    expect(formatPaise(12_000, { alwaysShowPaise: true })).toBe('₹120.00');
    expect(formatPaise(0, { alwaysShowPaise: true })).toBe('₹0.00');
    expect(formatPaise(6250, { alwaysShowPaise: true })).toBe('₹62.50');
    expect(formatPaise(12_000, { alwaysShowPaise: false })).toBe('₹120');
    expect(formatPaise(12_000, { alwaysShowPaise: undefined })).toBe('₹120');
  });
});

describe('formatHourlyRate', () => {
  it.each([
    [8000, '₹80/hr'],
    [6250, '₹62.50/hr'],
    [125_000, '₹1,250/hr'],
  ])('formats %d paise as %s', (paise, expected) => {
    expect(formatHourlyRate(paise)).toBe(expected);
  });
});
