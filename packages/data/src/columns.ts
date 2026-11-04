import type { HHMM, IsoInstant } from '@gog/domain';
import { z } from 'zod';

/**
 * Zod schemas for the scalar encodings PostgREST uses, shared by the catalog and booking mappers.
 * Postgres renders `timestamptz` as `2026-11-19T12:30:00+00:00` and `time` as `HH:MM:SS`; the
 * domain wants the shortest UTC form (`2026-11-19T12:30:00Z`, as `@gog/domain` produces it) and
 * `HH:MM`, so instants compare as strings and times match the `HHMM` scalar.
 */

/** The shortest lossless UTC form of an epoch instant; milliseconds only when they are non-zero. */
export function instantFromEpochMs(epochMs: number): IsoInstant {
  const iso = new Date(epochMs).toISOString();
  return iso.endsWith('.000Z') ? `${iso.slice(0, -5)}Z` : iso;
}

/** Postgres may render microseconds; `Date` understands at most milliseconds. */
const EXCESS_FRACTION = /(\.\d{3})\d+/;

/** A `timestamptz` column: any ISO 8601 instant in, UTC `Z` out. */
export const InstantColumn = z.string().transform((value, ctx): IsoInstant => {
  const epochMs = Date.parse(value.replace(EXCESS_FRACTION, '$1'));
  if (Number.isNaN(epochMs)) {
    ctx.addIssue({ code: 'custom', message: `Not an ISO 8601 instant: ${value}` });
    return z.NEVER;
  }
  return instantFromEpochMs(epochMs);
});

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

/** A `time` column: `HH:MM:SS` (or `HH:MM`) in, `HH:MM` out. */
export const TimeColumn = z.string().transform((value, ctx): HHMM => {
  const match = TIME_PATTERN.exec(value);
  if (match === null) {
    ctx.addIssue({ code: 'custom', message: `Not a wall-clock time: ${value}` });
    return z.NEVER;
  }
  return `${match[1]}:${match[2]}`;
});
