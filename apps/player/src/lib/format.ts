import {
  addDays,
  formatCount,
  formatHourlyRate,
  formatIstDate,
  formatIstTime,
  istToInstant,
  type IsoInstant,
  type LocalDate,
  type Minutes,
  type Paise,
} from '@gog/domain';

/**
 * Display helpers composed from the domain formatters. Nothing here decides anything; it only
 * turns domain values into the words the screens show. "Now" comes from `lib/clock.ts`.
 */

const NOON_MINUTES = 12 * 60;

/** "7:30 pm – 9:30 pm" */
export function formatTimeRange(startsAt: IsoInstant, endsAt: IsoInstant): string {
  return `${formatIstTime(startsAt, { style: 'short' })} – ${formatIstTime(endsAt, { style: 'short' })}`;
}

/** "Sat, 21 Nov · 7:30 pm – 9:30 pm" */
export function formatSession(startsAt: IsoInstant, endsAt: IsoInstant): string {
  return `${formatIstDate(startsAt)} · ${formatTimeRange(startsAt, endsAt)}`;
}

/** "₹120/hr" */
export function formatRatePerHour(paise: Paise): string {
  return formatHourlyRate(paise);
}

export function formatSeats(count: number): string {
  return formatCount(count, 'seat');
}

export function formatStations(count: number): string {
  return formatCount(count, 'station');
}

/** "30 min", "1 h", "1 h 30 min" */
export function formatDuration(minutes: Minutes): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** "Today", "Tomorrow", then "Sat, 21 Nov". Noon avoids any edge of the day when converting. */
export function formatDayLabel(day: LocalDate, today: LocalDate): string {
  if (day === today) {
    return 'Today';
  }
  if (day === addDays(today, 1)) {
    return 'Tomorrow';
  }
  return formatIstDate(istToInstant(day, NOON_MINUTES));
}

/** Profiles store digits without `+` (`919999900001`); the `+` and grouping exist only on screen. */
export function formatPhoneForDisplay(digits: string): string {
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}
