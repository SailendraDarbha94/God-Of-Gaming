import { describe, expect, it } from 'vitest';
import type { OpeningHours } from './entities';
import { groupHoursForDisplay, isOpenDuring, openingWindowFor, slotStarts } from './hours';
import { addDays, addMinutes, istToInstant, minutesBetween } from './time';

/** The sample default (spec 08): Sun–Thu 10:00–23:00, Fri–Sat 10:00–02:00 overnight. */
const WEEKEND_LATE: OpeningHours[] = [
  { weekday: 0, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 1, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 2, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 3, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 4, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 5, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
  { weekday: 6, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
];

/** The spec's worked example: Friday 22:00–02:00 overnight, Saturday 10:00–02:00, else closed. */
const FRIDAY_NIGHT: OpeningHours[] = [
  { weekday: 5, opensAt: '22:00', closesAt: '02:00', isOvernight: true },
  { weekday: 6, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
];

/** Side Quest (spec 08): daily 11:00–23:30, no overnight. */
const DAILY: OpeningHours[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  opensAt: '11:00',
  closesAt: '23:30',
  isOvernight: false,
}));

const FRIDAY = '2026-11-20';
const SATURDAY = '2026-11-21';
const THURSDAY = '2026-11-19';

describe('openingWindowFor', () => {
  it('builds the IST window of the opening day', () => {
    expect(openingWindowFor(WEEKEND_LATE, THURSDAY)).toEqual({
      opensAt: '2026-11-19T04:30:00Z',
      closesAt: '2026-11-19T17:30:00Z',
    });
  });

  it('closes an overnight window on the next day', () => {
    expect(openingWindowFor(FRIDAY_NIGHT, FRIDAY)).toEqual({
      opensAt: '2026-11-20T16:30:00Z',
      closesAt: '2026-11-20T20:30:00Z',
    });
    expect(openingWindowFor(WEEKEND_LATE, SATURDAY)).toEqual({
      opensAt: '2026-11-21T04:30:00Z',
      closesAt: '2026-11-21T20:30:00Z',
    });
  });

  it('treats 00:00–00:00 overnight as a full day', () => {
    const allDay: OpeningHours[] = [
      { weekday: 5, opensAt: '00:00', closesAt: '00:00', isOvernight: true },
    ];
    expect(openingWindowFor(allDay, FRIDAY)).toEqual({
      opensAt: '2026-11-19T18:30:00Z',
      closesAt: '2026-11-20T18:30:00Z',
    });
  });

  it('is null on a closed weekday', () => {
    expect(openingWindowFor(FRIDAY_NIGHT, THURSDAY)).toBeNull();
    expect(openingWindowFor([], FRIDAY)).toBeNull();
  });

  it('uses the first row when a weekday is duplicated', () => {
    const duplicated: OpeningHours[] = [
      { weekday: 5, opensAt: '10:00', closesAt: '20:00', isOvernight: false },
      { weekday: 5, opensAt: '12:00', closesAt: '22:00', isOvernight: false },
    ];
    expect(openingWindowFor(duplicated, FRIDAY)?.opensAt).toBe('2026-11-20T04:30:00Z');
  });
});

describe('isOpenDuring', () => {
  it('accepts a session inside the day window', () => {
    // Thursday 22:00–23:00 IST
    expect(isOpenDuring(WEEKEND_LATE, '2026-11-19T16:30:00Z', '2026-11-19T17:30:00Z')).toBe(true);
  });

  it('accepts a session filling the whole window and rejects one spilling past closing', () => {
    expect(isOpenDuring(FRIDAY_NIGHT, '2026-11-20T16:30:00Z', '2026-11-20T20:30:00Z')).toBe(true);
    // Thursday 22:30–23:30 IST at a 23:00 close
    expect(isOpenDuring(WEEKEND_LATE, '2026-11-19T17:00:00Z', '2026-11-19T18:00:00Z')).toBe(false);
  });

  it('finds a post-midnight session in the previous day overnight window', () => {
    // Saturday 00:30–01:30 IST sits in Friday's 22:00–02:00 window
    expect(isOpenDuring(FRIDAY_NIGHT, '2026-11-20T19:00:00Z', '2026-11-20T20:00:00Z')).toBe(true);
    // Saturday 01:30–02:30 IST fails Friday's window and Saturday's own
    expect(isOpenDuring(FRIDAY_NIGHT, '2026-11-20T20:00:00Z', '2026-11-20T21:00:00Z')).toBe(false);
  });

  it('rejects a session that starts before opening', () => {
    // Friday 21:30–22:30 IST
    expect(isOpenDuring(FRIDAY_NIGHT, '2026-11-20T16:00:00Z', '2026-11-20T17:00:00Z')).toBe(false);
  });

  it('rejects a session on a closed day', () => {
    expect(isOpenDuring(FRIDAY_NIGHT, '2026-11-19T16:30:00Z', '2026-11-19T17:30:00Z')).toBe(false);
    expect(isOpenDuring([], '2026-11-20T16:30:00Z', '2026-11-20T17:30:00Z')).toBe(false);
  });

  it('does not let a non-overnight previous day leak into today', () => {
    // Monday 00:30–01:30 IST after a Sunday 10:00–23:00 day
    expect(isOpenDuring(WEEKEND_LATE, '2026-11-22T19:00:00Z', '2026-11-22T20:00:00Z')).toBe(false);
  });

  it('rejects an empty or reversed range', () => {
    expect(isOpenDuring(WEEKEND_LATE, '2026-11-19T16:30:00Z', '2026-11-19T16:30:00Z')).toBe(false);
    expect(isOpenDuring(WEEKEND_LATE, '2026-11-19T17:30:00Z', '2026-11-19T16:30:00Z')).toBe(false);
  });
});

describe('slotStarts', () => {
  it('steps through an overnight window up to the last start that still fits', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60 })).toEqual([
      '2026-11-20T16:30:00Z',
      '2026-11-20T17:00:00Z',
      '2026-11-20T17:30:00Z',
      '2026-11-20T18:00:00Z',
      '2026-11-20T18:30:00Z',
      '2026-11-20T19:00:00Z',
      '2026-11-20T19:30:00Z',
    ]);
  });

  it('honours a custom step', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60, stepMinutes: 60 })).toEqual([
      '2026-11-20T16:30:00Z',
      '2026-11-20T17:30:00Z',
      '2026-11-20T18:30:00Z',
      '2026-11-20T19:30:00Z',
    ]);
    expect(
      slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60, stepMinutes: undefined }),
    ).toEqual(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60 }));
  });

  it('returns a single start when the session fills the window', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 240 })).toEqual([
      '2026-11-20T16:30:00Z',
    ]);
  });

  it('returns nothing when the session is longer than the window', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 270 })).toEqual([]);
  });

  it('returns nothing on a closed day', () => {
    expect(slotStarts(FRIDAY_NIGHT, THURSDAY, { durationMinutes: 60 })).toEqual([]);
  });

  it('returns nothing for a non-positive duration or step', () => {
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 0 })).toEqual([]);
    expect(slotStarts(FRIDAY_NIGHT, FRIDAY, { durationMinutes: 60, stepMinutes: 0 })).toEqual([]);
  });

  it('never produces a session that ends after closing', () => {
    const week = Array.from({ length: 7 }, (_, offset) => addDays('2026-11-22', offset));
    for (const hours of [WEEKEND_LATE, FRIDAY_NIGHT, DAILY]) {
      for (const day of week) {
        const window = openingWindowFor(hours, day);
        for (const durationMinutes of [30, 60, 90, 120, 180, 240, 300, 360]) {
          for (const stepMinutes of [30, 60, 45]) {
            const starts = slotStarts(hours, day, { durationMinutes, stepMinutes });
            if (window === null) {
              expect(starts).toEqual([]);
              continue;
            }
            for (const start of starts) {
              expect(minutesBetween(window.opensAt, start)).toBeGreaterThanOrEqual(0);
              expect(
                minutesBetween(addMinutes(start, durationMinutes), window.closesAt),
              ).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    }
  });

  it('starts at opening and steps evenly', () => {
    const starts = slotStarts(DAILY, '2026-11-18', { durationMinutes: 30 });
    expect(starts[0]).toBe(istToInstant('2026-11-18', 11 * 60));
    expect(starts).toHaveLength(25);
    expect(starts.at(-1)).toBe(istToInstant('2026-11-18', 23 * 60));
    starts.slice(1).forEach((start, index) => {
      expect(minutesBetween(starts[index] ?? start, start)).toBe(30);
    });
  });
});

describe('groupHoursForDisplay', () => {
  it('groups consecutive weekdays with identical hours, Sunday first', () => {
    expect(groupHoursForDisplay(WEEKEND_LATE)).toEqual([
      { days: 'Sun – Thu', hours: '10:00 am – 11:00 pm' },
      { days: 'Fri – Sat', hours: '10:00 am – 2:00 am (next day)' },
    ]);
  });

  it('matches the spec example with a closed Sunday', () => {
    const hours: OpeningHours[] = [
      ...[1, 2, 3, 4].map((weekday) => ({
        weekday,
        opensAt: '11:00',
        closesAt: '23:00',
        isOvernight: false,
      })),
      ...[5, 6].map((weekday) => ({
        weekday,
        opensAt: '11:00',
        closesAt: '02:00',
        isOvernight: true,
      })),
    ];
    expect(groupHoursForDisplay(hours)).toEqual([
      { days: 'Sun', hours: 'Closed' },
      { days: 'Mon – Thu', hours: '11:00 am – 11:00 pm' },
      { days: 'Fri – Sat', hours: '11:00 am – 2:00 am (next day)' },
    ]);
  });

  it('collapses a uniform week into one row', () => {
    expect(groupHoursForDisplay(DAILY)).toEqual([
      { days: 'Sun – Sat', hours: '11:00 am – 11:30 pm' },
    ]);
  });

  it('reports a cafe with no hours as closed all week', () => {
    expect(groupHoursForDisplay([])).toEqual([{ days: 'Sun – Sat', hours: 'Closed' }]);
  });

  it('groups consecutive closed days and keeps single days unranged', () => {
    const hours: OpeningHours[] = [
      { weekday: 0, opensAt: '10:00', closesAt: '22:00', isOvernight: false },
      { weekday: 3, opensAt: '12:00', closesAt: '20:00', isOvernight: false },
      { weekday: 4, opensAt: '10:00', closesAt: '22:00', isOvernight: false },
      { weekday: 5, opensAt: '10:00', closesAt: '22:00', isOvernight: false },
      { weekday: 6, opensAt: '10:00', closesAt: '22:00', isOvernight: false },
    ];
    expect(groupHoursForDisplay(hours)).toEqual([
      { days: 'Sun', hours: '10:00 am – 10:00 pm' },
      { days: 'Mon – Tue', hours: 'Closed' },
      { days: 'Wed', hours: '12:00 pm – 8:00 pm' },
      { days: 'Thu – Sat', hours: '10:00 am – 10:00 pm' },
    ]);
  });

  it('does not wrap Saturday into Sunday and ignores input order', () => {
    const shuffled = [...WEEKEND_LATE].reverse();
    expect(groupHoursForDisplay(shuffled)).toEqual(groupHoursForDisplay(WEEKEND_LATE));
    const weekendOnly: OpeningHours[] = [
      { weekday: 6, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
      { weekday: 0, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
    ];
    expect(groupHoursForDisplay(weekendOnly)).toEqual([
      { days: 'Sun', hours: '10:00 am – 2:00 am (next day)' },
      { days: 'Mon – Fri', hours: 'Closed' },
      { days: 'Sat', hours: '10:00 am – 2:00 am (next day)' },
    ]);
  });
});
