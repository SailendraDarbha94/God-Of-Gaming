import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Failures of the data layer that are not business outcomes (spec 04, 07 §Code):
 *
 * - `transport`: the request never got a response (network down, aborted, timed out);
 * - `rejected`: PostgREST or Postgres answered a read with an error (a catalog query can only be
 *   rejected by a bug or a configuration change, never by the player);
 * - `invalid_response`: a response did not have the recorded shape;
 * - `auth`: Supabase Auth refused a sign-in step.
 *
 * Business failures of the booking flow are `BookingError` from `@gog/domain`.
 */
export type DataErrorCode = 'transport' | 'rejected' | 'invalid_response' | 'auth';

export class DataError extends Error {
  readonly code: DataErrorCode;

  constructor(code: DataErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataError';
    this.code = code;
  }
}

/** The fields PostgREST puts in an error body; a `PostgrestError` instance has exactly these. */
export type PostgrestFailure = Pick<PostgrestError, 'code' | 'message' | 'details' | 'hint'>;

/**
 * postgrest-js reports a fetch that never got a response as an error with an empty `code` and HTTP
 * status 0; every error PostgREST or Postgres answers with carries a code.
 */
export function isTransportFailure(error: PostgrestFailure): boolean {
  return error.code === '';
}

/** A failed read as a `DataError`, keeping the PostgREST error as `cause`. */
export function dataErrorFromPostgrest(what: string, error: PostgrestFailure): DataError {
  return new DataError(
    isTransportFailure(error) ? 'transport' : 'rejected',
    `${what}: ${error.message}`,
    { cause: error },
  );
}
