import { z } from 'zod';

/**
 * Scalar schemas shared by every entity (spec 02 §Scalars). Each name is exported twice, as the Zod
 * schema and as its inferred type, so `Slug.parse(input)` is how `unknown` becomes a `Slug`.
 *
 * Zod 4 spellings are used: `z.string().uuid()` and `z.string().datetime()` are deprecated there in
 * favour of `z.uuid()` and `z.iso.datetime()`, which validate the same values, and `z.iso.date()`
 * additionally rejects impossible calendar dates such as `2026-02-30`.
 */

export const Uuid = z.uuid();
export type Uuid = z.infer<typeof Uuid>;

export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .min(2)
  .max(64);
export type Slug = z.infer<typeof Slug>;

/** An ISO 8601 instant with `Z` or a numeric offset. Our own code always produces UTC `Z`. */
export const IsoInstant = z.iso.datetime({ offset: true });
export type IsoInstant = z.infer<typeof IsoInstant>;

/** A calendar day in IST, `YYYY-MM-DD`. */
export const LocalDate = z.iso.date();
export type LocalDate = z.infer<typeof LocalDate>;

/** A local wall-clock time, `HH:MM`, 24-hour. */
export const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export type HHMM = z.infer<typeof HHMM>;

/** An amount of money as a whole number of paise (ADR 0009). */
export const Paise = z.number().int().nonnegative();
export type Paise = z.infer<typeof Paise>;

export const Minutes = z.number().int();
export type Minutes = z.infer<typeof Minutes>;

/** 0 = Sunday … 6 = Saturday, as in `Date#getDay()` and Postgres `extract(dow)`. */
export const Weekday = z.number().int().min(0).max(6);
export type Weekday = z.infer<typeof Weekday>;
