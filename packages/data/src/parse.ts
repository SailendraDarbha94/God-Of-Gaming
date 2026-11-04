import { z } from 'zod';
import { DataError } from './errors';

/**
 * Narrows an `unknown` value at a boundary (a PostgREST row, an auth session) with a Zod schema and
 * reports a mismatch as a `DataError('invalid_response')` so callers see one error type for "the
 * backend did not answer in the recorded shape" (spec 07 §Code: unknown at every boundary).
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, what: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DataError('invalid_response', `${what}: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}

const UnknownRows = z.array(z.unknown());

/** A list response must be an array; each element is narrowed by its own mapper afterwards. */
export function parseRows(value: unknown, what: string): unknown[] {
  return parseOrThrow(UnknownRows, value, what);
}
