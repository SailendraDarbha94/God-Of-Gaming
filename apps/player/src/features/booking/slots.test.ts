import type { OpeningHours, Weekday } from '@gog/domain';
import { describe, expect, it } from 'vitest';

import { dayOptions, toSlotOptions, upcomingStarts, type BookingDraft } from './slots';

const CAFE_ID = '00000000-0000-4000-8000-000000000301';
const TIER_ID = '00000000-0000-4000-8000-000000000311';
const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

function draft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return { cafeId: CAFE_ID, tierId: TIER_ID, durationMinutes: 60, seatCount: 1, ...overrides };
}

/** Pixel Den (spec 08): Sun–Thu 10:00–23:00, Fri–Sat 10:00–02:00 overnight. */
const PIXEL_DEN: OpeningHours[] = WEEKDAYS.map((weekday) =>
  weekday === 5 || weekday === 6
    ? { weekday, opensAt: '10:00', closesAt: '02:00', isOvernight: true }
    : { weekday, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
);

/** Side Quest (spec 08): daily 11:00–23:30, no overnight. */
const SIDE_QUEST: OpeningHours[] = WEEKDAYS.map((weekday) => ({
  weekday,
  opensAt: '11:00',
  closesAt: '23:30',
  isOvernight: false,
}));

// Saturday 21 November 2026; IST is UTC+05:30.
const SAT_0030 = '2026-11-20T19:00:00Z';
const SAT_0120 = '2026-11-20T19:50:00Z';
const SAT_0130 = '2026-11-20T20:00:00Z';
const SAT_0930 = '2026-11-21T04:00:00Z';
const SAT_2100 = '2026-11-21T15:30:00Z';
const SUN_2315 = '2026-11-22T17:45:00Z';

describe('dayOptions', () => {
  it('offers the still-open Friday window first as "Late night" at Saturday 00:30', () => {
    const days = dayOptions(PIXEL_DEN, draft(), SAT_0030);
    expect(days.slice(0, 3)).toEqual([
      { day: '2026-11-20', label: 'Late night' },
      { day: '2026-11-21', label: 'Today' },
      { day: '2026-11-22', label: 'Tomorrow' },
    ]);
    expect(days).toHaveLength(15);
  });

  it('drops "Late night" once no Friday start fits the lead time (01:30, 60 minutes)', () => {
    const days = dayOptions(PIXEL_DEN, draft(), SAT_0130);
    expect(days[0]).toEqual({ day: '2026-11-21', label: 'Today' });
    expect(days).toHaveLength(14);
  });

  it('keeps "Late night" while a shorter session still fits (01:20, 30 minutes)', () => {
    expect(dayOptions(PIXEL_DEN, draft({ durationMinutes: 30 }), SAT_0120)[0]).toEqual({
      day: '2026-11-20',
      label: 'Late night',
    });
    expect(dayOptions(PIXEL_DEN, draft({ durationMinutes: 60 }), SAT_0120)[0]?.label).toBe('Today');
  });

  it('never offers "Late night" at a cafe without overnight hours', () => {
    expect(dayOptions(SIDE_QUEST, draft(), SAT_0030)[0]).toEqual({
      day: '2026-11-21',
      label: 'Today',
    });
  });

  it('drops today once the cafe has closed (Sunday 23:15 at a 23:00 close)', () => {
    const days = dayOptions(PIXEL_DEN, draft(), SUN_2315);
    expect(days[0]).toEqual({ day: '2026-11-23', label: 'Tomorrow' });
    expect(days.some((option) => option.day === '2026-11-22')).toBe(false);
    expect(days).toHaveLength(13);
  });

  it('lists every day whose window fits the duration before opening time', () => {
    const days = dayOptions(PIXEL_DEN, draft({ durationMinutes: 360 }), SAT_0930);
    expect(days[0]).toEqual({ day: '2026-11-21', label: 'Today' });
    expect(days).toHaveLength(14);
  });
});

describe('upcomingStarts', () => {
  it('is the opening-hour grid minus the starts that have passed', () => {
    expect(upcomingStarts(PIXEL_DEN, '2026-11-21', draft(), SAT_0930)).toHaveLength(31);
    const left = upcomingStarts(PIXEL_DEN, '2026-11-21', draft(), SAT_2100);
    expect(left[0]).toBe('2026-11-21T16:00:00Z'); // 21:30 IST, the first start 5 minutes ahead
    expect(left.at(-1)).toBe('2026-11-21T19:30:00Z'); // 01:00 IST on Sunday, ending at closing
    expect(left).toHaveLength(8);
  });
});

describe('toSlotOptions', () => {
  const allDay = upcomingStarts(PIXEL_DEN, '2026-11-21', draft(), SAT_0930).map((startsAt) => ({
    startsAt,
    freeSeats: 12,
  }));

  it('drops starts that have passed instead of greying them out', () => {
    const options = toSlotOptions(allDay, draft(), SAT_2100);
    expect(options.map((option) => option.startsAt)).toEqual(
      upcomingStarts(PIXEL_DEN, '2026-11-21', draft(), SAT_2100),
    );
    expect(options.every((option) => option.selectable)).toBe(true);
  });

  it('marks a start unselectable when the squad does not fit', () => {
    expect(
      toSlotOptions(
        [{ startsAt: '2026-11-21T16:00:00Z', freeSeats: 2 }],
        draft({ seatCount: 3 }),
        SAT_2100,
      ),
    ).toEqual([{ startsAt: '2026-11-21T16:00:00Z', freeSeats: 2, selectable: false }]);
  });

  it('marks a start beyond the booking horizon unselectable but keeps it', () => {
    const farStart = '2026-12-25T04:30:00Z';
    expect(toSlotOptions([{ startsAt: farStart, freeSeats: 12 }], draft(), SAT_2100)).toEqual([
      { startsAt: farStart, freeSeats: 12, selectable: false },
    ]);
  });
});
