import { describe, expect, it } from 'vitest';

import { normaliseIndianMobileInput, toIndianMobileE164 } from './phone';

describe('normaliseIndianMobileInput', () => {
  it.each([
    ['OS autofill with the country code', '+91 98765 43210'],
    ['a pasted E.164 number', '+919876543210'],
    ['a number typed with a space', '98765 43210'],
    ['a trunk-prefixed number', '098765 43210'],
    ['a bare number', '9876543210'],
    ['a number with phone-pad symbols', '98765*43210#'],
  ])('reads %s as the ten local digits', (_name, input) => {
    expect(normaliseIndianMobileInput(input)).toBe('9876543210');
  });

  it('strips the country code before capping, so the cap never eats the last digits', () => {
    expect(normaliseIndianMobileInput('+919876543210')).not.toBe('9198765432');
  });

  it('leaves a genuine number that starts with 91 alone', () => {
    expect(normaliseIndianMobileInput('9112345678')).toBe('9112345678');
  });

  it('caps while typing', () => {
    expect(normaliseIndianMobileInput('98765432101')).toBe('9876543210');
    expect(normaliseIndianMobileInput('987')).toBe('987');
    expect(normaliseIndianMobileInput('')).toBe('');
  });
});

describe('toIndianMobileE164', () => {
  it('produces the E.164 form the gateway sends', () => {
    expect(toIndianMobileE164('+91 98765 43210')).toBe('+919876543210');
    expect(toIndianMobileE164('9876543210')).toBe('+919876543210');
  });

  it('rejects numbers that are not Indian mobiles', () => {
    expect(toIndianMobileE164('1234567890')).toBeNull();
    expect(toIndianMobileE164('98765')).toBeNull();
    expect(toIndianMobileE164('+1 415 555 0100')).toBeNull();
    expect(toIndianMobileE164('')).toBeNull();
  });
});
