import { BOOKING_RULES } from './constants';
import type { OpeningHours } from './entities';
import type { IsoInstant, LocalDate, Minutes, Weekday } from './scalars';
import {
  addDays,
  addMinutes,
  formatWallClockTime,
  formatWeekday,
  instantToIst,
  istToInstant,
  minutesBetween,
  parseHHMM,
  weekdayOf,
} from './time';

/**
 * Opening hours (spec 02 §Opening hours). Windows are keyed by the opening day in IST: slots after
 * midnight belong to the day the cafe opened, so a Saturday 00:30 session inside a Friday
 * 22:00–02:00 window is requested with the Friday date, matching `cafe_open_window(p_day)` in SQL.
 */

const MINUTES_PER_DAY = 24 * 60;
const DAYS_PER_WEEK = 7;

export interface OpeningWindow {
  opensAt: IsoInstant;
  closesAt: IsoInstant;
}

export interface SlotOptions {
  durationMinutes: Minutes;
  /** Defaults to the 30-minute booking grid. */
  stepMinutes?: Minutes | undefined;
}

export interface HoursDisplayGroup {
  /** "Mon – Thu", or a single day such as "Sun". */
  days: string;
  /** "11:00 am – 2:00 am (next day)", or "Closed". */
  hours: string;
}

interface WeekdayRun {
  from: Weekday;
  to: Weekday;
  hours: string;
}

/** The window the cafe opens on `day`; null when closed that weekday. Overnight closes next day. */
export function openingWindowFor(hours: OpeningHours[], day: LocalDate): OpeningWindow | null {
  const weekday = weekdayOf(day);
  const row = hours.find((candidate) => candidate.weekday === weekday);
  if (row === undefined) {
    return null;
  }
  const closesMinutes = parseHHMM(row.closesAt) + (row.isOvernight ? MINUTES_PER_DAY : 0);
  return {
    opensAt: istToInstant(day, parseHHMM(row.opensAt)),
    closesAt: istToInstant(day, closesMinutes),
  };
}

function windowContains(window: OpeningWindow | null, startMs: number, endMs: number): boolean {
  return (
    window !== null && startMs >= Date.parse(window.opensAt) && endMs <= Date.parse(window.closesAt)
  );
}

/**
 * True when `[startsAt, endsAt)` sits inside the window of the IST day of `startsAt` or inside the
 * previous day's overnight window; false for an empty or reversed range. Like `cafe_is_open_during`
 * in SQL, a session that crosses a window boundary is rejected.
 */
export function isOpenDuring(
  hours: OpeningHours[],
  startsAt: IsoInstant,
  endsAt: IsoInstant,
): boolean {
  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  if (startMs >= endMs) {
    return false;
  }
  const { day } = instantToIst(startsAt);
  return [day, addDays(day, -1)].some((candidate) =>
    windowContains(openingWindowFor(hours, candidate), startMs, endMs),
  );
}

/** Every start from opening, stepping, such that `start + duration <= closesAt`. */
export function slotStarts(
  hours: OpeningHours[],
  day: LocalDate,
  options: SlotOptions,
): IsoInstant[] {
  const { durationMinutes } = options;
  const stepMinutes = options.stepMinutes ?? BOOKING_RULES.stepMinutes;
  const openingWindow = openingWindowFor(hours, day);
  if (openingWindow === null || durationMinutes < 1 || stepMinutes < 1) {
    return [];
  }
  const windowMinutes = minutesBetween(openingWindow.opensAt, openingWindow.closesAt);
  if (durationMinutes > windowMinutes) {
    return [];
  }
  const count = Math.floor((windowMinutes - durationMinutes) / stepMinutes) + 1;
  return Array.from({ length: count }, (_, index) =>
    addMinutes(openingWindow.opensAt, index * stepMinutes),
  );
}

function describeHours(row: OpeningHours | undefined): string {
  if (row === undefined) {
    return 'Closed';
  }
  const opens = formatWallClockTime(parseHHMM(row.opensAt));
  const closes = formatWallClockTime(parseHHMM(row.closesAt));
  return row.isOvernight ? `${opens} – ${closes} (next day)` : `${opens} – ${closes}`;
}

function describeDays(run: WeekdayRun): string {
  return run.from === run.to
    ? formatWeekday(run.from)
    : `${formatWeekday(run.from)} – ${formatWeekday(run.to)}`;
}

/**
 * Consecutive weekdays with identical hours grouped for display, Sunday first (the `Weekday`
 * order) and without wrapping Saturday into Sunday. Weekdays without a row read as "Closed".
 */
export function groupHoursForDisplay(hours: OpeningHours[]): HoursDisplayGroup[] {
  const byWeekday = new Map<Weekday, OpeningHours>();
  for (const row of hours) {
    if (!byWeekday.has(row.weekday)) {
      byWeekday.set(row.weekday, row);
    }
  }
  const runs: WeekdayRun[] = [];
  for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday += 1) {
    const label = describeHours(byWeekday.get(weekday));
    const last = runs.at(-1);
    if (last?.hours === label) {
      last.to = weekday;
    } else {
      runs.push({ from: weekday, to: weekday, hours: label });
    }
  }
  return runs.map((run) => ({ days: describeDays(run), hours: run.hours }));
}
