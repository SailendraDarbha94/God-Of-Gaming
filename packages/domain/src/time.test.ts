import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMinutes,
  formatHHMM,
  formatIstDate,
  formatIstTime,
  formatWallClockTime,
  formatWeekday,
  instantToIst,
  istToInstant,
  minutesBetween,
  parseHHMM,
  weekdayOf,
} from './time';

// Friday 20 November 2026 is the spec's worked example; Nov 30 2026 is a Monday, Jan 1 2027 a Friday.

describe('istToInstant', () => {
  it('converts an IST wall-clock time to a UTC instant', () => {
    expect(istToInstant('2026-11-20', 22 * 60)).toBe('2026-11-20T16:30:00Z');
    expect(istToInstant('2026-11-20', 10 * 60)).toBe('2026-11-20T04:30:00Z');
  });

  it('lets minutes exceed a day to reach the next calendar day', () => {
    expect(istToInstant('2026-11-20', 26 * 60)).toBe('2026-11-20T20:30:00Z');
    expect(istToInstant('2026-11-20', 24 * 60)).toBe('2026-11-20T18:30:00Z');
  });

  it('places IST midnight on the previous UTC day', () => {
    expect(istToInstant('2026-11-21', 0)).toBe('2026-11-20T18:30:00Z');
    expect(istToInstant('2026-12-01', 0)).toBe('2026-11-30T18:30:00Z');
    expect(istToInstant('2027-01-01', 0)).toBe('2026-12-31T18:30:00Z');
  });

  it('rejects a malformed day', () => {
    expect(() => istToInstant('20261120', 0)).toThrow(RangeError);
  });
});

describe('instantToIst', () => {
  it('reads the IST day, minutes and weekday of an instant', () => {
    expect(instantToIst('2026-11-20T16:30:00Z')).toEqual({
      day: '2026-11-20',
      minutesFromMidnight: 22 * 60,
      weekday: 5,
    });
  });

  it('flips the day at IST midnight, not UTC midnight', () => {
    expect(instantToIst('2026-11-20T18:29:00Z')).toEqual({
      day: '2026-11-20',
      minutesFromMidnight: 23 * 60 + 59,
      weekday: 5,
    });
    expect(instantToIst('2026-11-20T18:30:00Z')).toEqual({
      day: '2026-11-21',
      minutesFromMidnight: 0,
      weekday: 6,
    });
    expect(instantToIst('2026-11-20T19:00:00Z')).toEqual({
      day: '2026-11-21',
      minutesFromMidnight: 30,
      weekday: 6,
    });
  });

  it('crosses a month end and a year end', () => {
    expect(instantToIst('2026-11-30T18:29:00Z')).toEqual({
      day: '2026-11-30',
      minutesFromMidnight: 23 * 60 + 59,
      weekday: 1,
    });
    expect(instantToIst('2026-11-30T18:30:00Z')).toEqual({
      day: '2026-12-01',
      minutesFromMidnight: 0,
      weekday: 2,
    });
    expect(instantToIst('2026-12-31T18:30:00Z')).toEqual({
      day: '2027-01-01',
      minutesFromMidnight: 0,
      weekday: 5,
    });
  });

  it('knows leap days', () => {
    expect(instantToIst('2028-02-28T18:30:00Z').day).toBe('2028-02-29');
    expect(instantToIst('2026-02-28T18:30:00Z').day).toBe('2026-03-01');
  });

  it('drops seconds and accepts offset forms', () => {
    expect(instantToIst('2026-11-20T16:30:45Z').minutesFromMidnight).toBe(22 * 60);
    expect(instantToIst('2026-11-20T22:00:00+05:30')).toEqual(instantToIst('2026-11-20T16:30:00Z'));
  });

  it('round-trips through istToInstant', () => {
    for (const minutes of [0, 30, 9 * 60 + 15, 23 * 60 + 59]) {
      expect(instantToIst(istToInstant('2026-11-21', minutes))).toEqual({
        day: '2026-11-21',
        minutesFromMidnight: minutes,
        weekday: 6,
      });
    }
  });
});

describe('parseHHMM and formatHHMM', () => {
  it.each([
    ['00:00', 0],
    ['09:05', 545],
    ['22:00', 1320],
    ['23:59', 1439],
  ])('%s is %d minutes and back', (text, minutes) => {
    expect(parseHHMM(text)).toBe(minutes);
    expect(formatHHMM(minutes)).toBe(text);
  });

  it('wraps around the day', () => {
    expect(formatHHMM(24 * 60)).toBe('00:00');
    expect(formatHHMM(26 * 60)).toBe('02:00');
    expect(formatHHMM(-30)).toBe('23:30');
  });

  it('rejects a malformed time', () => {
    expect(() => parseHHMM('9:00')).toThrow(RangeError);
  });
});

describe('addMinutes', () => {
  it('adds and subtracts minutes', () => {
    expect(addMinutes('2026-11-20T16:30:00Z', 90)).toBe('2026-11-20T18:00:00Z');
    expect(addMinutes('2026-11-20T16:30:00Z', -30)).toBe('2026-11-20T16:00:00Z');
    expect(addMinutes('2026-11-20T16:30:00Z', 0)).toBe('2026-11-20T16:30:00Z');
  });

  it('crosses a UTC day boundary', () => {
    expect(addMinutes('2026-11-20T23:30:00Z', 60)).toBe('2026-11-21T00:30:00Z');
  });

  it('normalises offsets to Z and keeps non-zero milliseconds', () => {
    expect(addMinutes('2026-11-20T22:00:00+05:30', 0)).toBe('2026-11-20T16:30:00Z');
    expect(addMinutes('2026-11-20T16:30:00.500Z', 1)).toBe('2026-11-20T16:31:00.500Z');
  });
});

describe('minutesBetween', () => {
  it('measures signed whole minutes', () => {
    expect(minutesBetween('2026-11-20T16:30:00Z', '2026-11-20T18:00:00Z')).toBe(90);
    expect(minutesBetween('2026-11-20T18:00:00Z', '2026-11-20T16:30:00Z')).toBe(-90);
    expect(minutesBetween('2026-11-20T16:30:00Z', '2026-11-20T16:30:00Z')).toBe(0);
  });

  it('truncates partial minutes towards zero', () => {
    expect(minutesBetween('2026-11-20T10:00:00Z', '2026-11-20T10:00:45Z')).toBe(0);
    expect(minutesBetween('2026-11-20T10:00:00Z', '2026-11-20T10:01:45Z')).toBe(1);
    expect(minutesBetween('2026-11-20T10:01:45Z', '2026-11-20T10:00:00Z')).toBe(-1);
  });

  it('spans days', () => {
    expect(minutesBetween('2026-11-20T00:00:00Z', '2026-11-21T00:00:00Z')).toBe(24 * 60);
  });
});

describe('weekdayOf', () => {
  it.each([
    ['2026-11-20', 5],
    ['2026-11-21', 6],
    ['2026-11-22', 0],
    ['2026-11-04', 3],
    ['2027-01-01', 5],
  ])('%s is weekday %d', (day, weekday) => {
    expect(weekdayOf(day)).toBe(weekday);
  });
});

describe('addDays', () => {
  it.each([
    ['2026-11-20', 0, '2026-11-20'],
    ['2026-11-20', 1, '2026-11-21'],
    ['2026-11-20', -1, '2026-11-19'],
    ['2026-11-20', 7, '2026-11-27'],
    ['2026-11-30', 1, '2026-12-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-01-01', -1, '2025-12-31'],
    ['2026-03-01', -1, '2026-02-28'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-02-29', 1, '2028-03-01'],
  ])('%s + %d days is %s', (day, n, expected) => {
    expect(addDays(day, n)).toBe(expected);
  });
});

describe('formatWeekday', () => {
  it('uses three-letter English names, Sunday first', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(formatWeekday)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });

  it('rejects an out-of-range weekday', () => {
    expect(() => formatWeekday(7)).toThrow(RangeError);
  });
});

describe('formatWallClockTime', () => {
  it.each([
    [0, '12:00 am'],
    [5, '12:05 am'],
    [9 * 60, '9:00 am'],
    [11 * 60 + 30, '11:30 am'],
    [12 * 60, '12:00 pm'],
    [12 * 60 + 30, '12:30 pm'],
    [19 * 60 + 30, '7:30 pm'],
    [23 * 60 + 59, '11:59 pm'],
  ])('%d minutes is %s', (minutes, expected) => {
    expect(formatWallClockTime(minutes)).toBe(expected);
  });

  it('wraps an overnight closing time into the next day', () => {
    expect(formatWallClockTime(26 * 60)).toBe('2:00 am');
  });
});

describe('formatIstTime', () => {
  it('formats the IST wall-clock time in the short style', () => {
    expect(formatIstTime('2026-11-20T14:00:00Z')).toBe('7:30 pm');
    expect(formatIstTime('2026-11-20T14:00:00Z', { style: 'short' })).toBe('7:30 pm');
    expect(formatIstTime('2026-11-20T18:30:00Z')).toBe('12:00 am');
    expect(formatIstTime('2026-11-20T18:35:00Z')).toBe('12:05 am');
    expect(formatIstTime('2026-11-20T06:30:00Z')).toBe('12:00 pm');
    expect(formatIstTime('2026-11-20T03:30:00Z')).toBe('9:00 am');
    expect(formatIstTime('2026-11-20T17:59:00Z')).toBe('11:29 pm');
  });
});

describe('formatIstDate', () => {
  it('formats the IST calendar day as weekday, day and month', () => {
    expect(formatIstDate('2026-11-20T14:00:00Z')).toBe('Fri, 20 Nov');
    expect(formatIstDate('2026-11-20T19:00:00Z')).toBe('Sat, 21 Nov');
  });

  it('does not pad the day and crosses month and year ends in IST', () => {
    expect(formatIstDate('2026-11-30T18:30:00Z')).toBe('Tue, 1 Dec');
    expect(formatIstDate('2026-12-31T18:30:00Z')).toBe('Fri, 1 Jan');
    expect(formatIstDate('2026-12-31T18:29:00Z')).toBe('Thu, 31 Dec');
  });
});
