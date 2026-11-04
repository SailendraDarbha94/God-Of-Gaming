import {
  BOOKING_RULES,
  STATION_KIND_LABELS,
  amenityLabel as domainAmenityLabel,
  formatCount,
  formatHourlyRate as domainFormatHourlyRate,
  formatIstDate,
  formatIstTime,
  groupHoursForDisplay,
  instantToIst,
} from '@gog/domain';
import type { HoursDisplayGroup, IsoInstant, OpeningHours, Paise, StationKind } from '@gog/domain';

/**
 * Display formatting for the website, on top of the domain formatters (ADR 0009: rupees and IST
 * exist only at the display edge). Components import from here, never from `@gog/domain` directly.
 */

export function formatHourlyRate(paise: Paise): string {
  return domainFormatHourlyRate(paise);
}

export function formatFromRate(paise: Paise | null): string {
  return paise === null ? 'Prices in the app' : `From ${formatHourlyRate(paise)}`;
}

export function formatStationCount(count: number): string {
  return formatCount(count, 'station');
}

export function formatCafeCount(count: number): string {
  return formatCount(count, 'cafe');
}

/** Squad limit and hold window as copy, so the site never drifts from the rules `create_booking` enforces. */
export const bookingLimits = {
  maxSeats: BOOKING_RULES.maxSeats,
  holdMinutes: BOOKING_RULES.holdMinutes,
} as const;

export function stationKindLabel(kind: StationKind): string {
  return STATION_KIND_LABELS[kind];
}

/** Every station kind, in the order the domain lists them (for filter links). */
export function stationKinds(): StationKind[] {
  return Object.keys(STATION_KIND_LABELS) as StationKind[];
}

/** Narrows URL input (`?kind=ps5`) to a station kind; unknown values are ignored by callers. */
export function isStationKind(value: string): value is StationKind {
  return Object.hasOwn(STATION_KIND_LABELS, value);
}

export function formatHoursForDisplay(hours: OpeningHours[]): HoursDisplayGroup[] {
  return groupHoursForDisplay(hours);
}

export function formatIstDateTime(instant: IsoInstant): string {
  return `${formatIstDate(instant)}, ${formatIstTime(instant, { style: 'short' })}`;
}

const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

/**
 * "Thu, 19 Nov, 6:00 pm – 2:00 am IST" for a same-day window; dates on both ends otherwise. A
 * whole-day campaign (starts 00:00 IST, ends 23:59 IST or never) prints dates only: "Sat, 7 Nov –
 * Sun, 31 Jan", "From Wed, 4 Nov".
 */
export function formatPromotionWindow(startsAt: IsoInstant, endsAt: IsoInstant | null): string {
  const startsAtMidnight = instantToIst(startsAt).minutesFromMidnight === 0;
  if (endsAt === null) {
    return startsAtMidnight
      ? `From ${formatIstDate(startsAt)}`
      : `From ${formatIstDateTime(startsAt)} IST`;
  }
  if (startsAtMidnight && instantToIst(endsAt).minutesFromMidnight === LAST_MINUTE_OF_DAY) {
    return `${formatIstDate(startsAt)} – ${formatIstDate(endsAt)}`;
  }
  const sameDay = instantToIst(startsAt).day === instantToIst(endsAt).day;
  const end = sameDay ? formatIstTime(endsAt, { style: 'short' }) : formatIstDateTime(endsAt);
  return `${formatIstDateTime(startsAt)} – ${end} IST`;
}

/** Specs are free-form key/value pairs ("RTX 4060", "165 Hz"); the values read fine on their own. */
export function formatSpecs(specs: Record<string, string>): string {
  return Object.values(specs).join(' · ');
}

/** The domain's labels for the spec 08 amenity slugs, shared with the player app. */
export function amenityLabel(slug: string): string {
  return domainAmenityLabel(slug);
}
