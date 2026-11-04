import { IST_OFFSET_MINUTES } from './constants';
import type { HHMM, IsoInstant, LocalDate, Minutes, Weekday } from './scalars';

/**
 * Time helpers for an India-only product (ADR 0009). IST is a fixed +05:30 offset, instants are
 * ISO 8601 strings in UTC and no date library is involved: wall-clock arithmetic runs on epoch
 * milliseconds shifted by the offset and read back through the UTC getters of `Date`.
 *
 * Inputs are trusted domain scalars (validated by Zod at the edges). A malformed `LocalDate` or
 * `HHMM` is a programming error and raises `RangeError`, like `Date` itself does.
 */

const MINUTE_MS = 60_000;
const MINUTES_PER_DAY = 24 * 60;
const DAY_MS = MINUTES_PER_DAY * MINUTE_MS;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * MINUTE_MS;

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const HHMM_PATTERN = /^(\d{2}):(\d{2})$/;

const WEEKDAY_SHORT: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface IstWallClock {
  day: LocalDate;
  /** Whole minutes since IST midnight; seconds are dropped. */
  minutesFromMidnight: number;
  weekday: Weekday;
}

export interface FormatIstTimeOptions {
  /** `short` is "7:30 pm". */
  style: 'short';
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Midnight UTC of a calendar day in epoch milliseconds: the day as a number, zone-free. */
function localDateToUtcMs(day: LocalDate): number {
  const match = LOCAL_DATE_PATTERN.exec(day);
  if (match === null) {
    throw new RangeError(`Invalid LocalDate: ${day}`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function utcMsToLocalDate(ms: number): LocalDate {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

/**
 * The shortest lossless UTC form: `2026-11-20T16:30:00Z`, or `…T16:30:00.500Z` only when the
 * instant carries milliseconds. Booking instants are minute-aligned, so they stay clean.
 */
function toIsoInstant(ms: number): IsoInstant {
  const iso = new Date(ms).toISOString();
  return iso.endsWith('.000Z') ? `${iso.slice(0, -5)}Z` : iso;
}

function monthName(month: number): string {
  const name = MONTH_SHORT[month];
  if (name === undefined) {
    throw new RangeError(`Month out of range: ${month}`);
  }
  return name;
}

/** `minutesFromMidnight` may exceed 1440: it then lands on the following day (overnight closing). */
export function istToInstant(day: LocalDate, minutesFromMidnight: number): IsoInstant {
  return toIsoInstant(localDateToUtcMs(day) + minutesFromMidnight * MINUTE_MS - IST_OFFSET_MS);
}

export function instantToIst(instant: IsoInstant): IstWallClock {
  const shifted = new Date(Date.parse(instant) + IST_OFFSET_MS);
  return {
    day: utcMsToLocalDate(shifted.getTime()),
    minutesFromMidnight: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

export function parseHHMM(value: HHMM): number {
  const match = HHMM_PATTERN.exec(value);
  if (match === null) {
    throw new RangeError(`Invalid HHMM: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Wraps around the day, so 1500 (an overnight closing time) formats as `01:00`. */
export function formatHHMM(minutes: number): HHMM {
  const ofDay = ((Math.trunc(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(ofDay / 60))}:${pad2(ofDay % 60)}`;
}

export function addMinutes(instant: IsoInstant, minutes: number): IsoInstant {
  return toIsoInstant(Date.parse(instant) + minutes * MINUTE_MS);
}

/** Whole minutes from `a` to `b`, truncated towards zero; negative when `b` is earlier. */
export function minutesBetween(a: IsoInstant, b: IsoInstant): Minutes {
  return Math.trunc((Date.parse(b) - Date.parse(a)) / MINUTE_MS);
}

export function weekdayOf(day: LocalDate): Weekday {
  return new Date(localDateToUtcMs(day)).getUTCDay();
}

export function addDays(day: LocalDate, n: number): LocalDate {
  return utcMsToLocalDate(localDateToUtcMs(day) + n * DAY_MS);
}

/** "Sat" for 6; shared by the hours display and the day picker. */
export function formatWeekday(weekday: Weekday): string {
  const name = WEEKDAY_SHORT[weekday];
  if (name === undefined) {
    throw new RangeError(`Weekday out of range: ${weekday}`);
  }
  return name;
}

/** "7:30 pm" for 1170 minutes; wraps around the day like `formatHHMM`. */
export function formatWallClockTime(minutesFromMidnight: number): string {
  const ofDay =
    ((Math.trunc(minutesFromMidnight) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours24 = Math.floor(ofDay / 60);
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${pad2(ofDay % 60)} ${hours24 < 12 ? 'am' : 'pm'}`;
}

export function formatIstTime(
  instant: IsoInstant,
  options: FormatIstTimeOptions = { style: 'short' },
): string {
  switch (options.style) {
    case 'short':
      return formatWallClockTime(instantToIst(instant).minutesFromMidnight);
  }
}

/** "Sat, 21 Nov" in IST. */
export function formatIstDate(instant: IsoInstant): string {
  const shifted = new Date(Date.parse(instant) + IST_OFFSET_MS);
  return `${formatWeekday(shifted.getUTCDay())}, ${shifted.getUTCDate()} ${monthName(shifted.getUTCMonth())}`;
}
