import { describe, expect, it } from 'vitest';
import { DataError, dataErrorFromPostgrest, isTransportFailure } from './errors';

const NETWORK_DOWN = {
  code: '',
  message: 'TypeError: fetch failed',
  details: 'TypeError: fetch failed\n\nCaused by: Error: connect ECONNREFUSED',
  hint: '',
};

const MISSING_TABLE = {
  code: '42P01',
  message: 'relation "public.nope" does not exist',
  details: '',
  hint: '',
};

describe('DataError', () => {
  it('carries a code, a name and the cause', () => {
    const cause = new Error('boom');
    const error = new DataError('transport', 'listCities failed', { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DataError');
    expect(error.code).toBe('transport');
    expect(error.message).toBe('listCities failed');
    expect(error.cause).toBe(cause);
  });
});

describe('isTransportFailure', () => {
  it('recognises the empty code postgrest-js uses when no response arrived', () => {
    expect(isTransportFailure(NETWORK_DOWN)).toBe(true);
    expect(isTransportFailure(MISSING_TABLE)).toBe(false);
    expect(isTransportFailure({ ...MISSING_TABLE, code: 'GG001' })).toBe(false);
  });
});

describe('dataErrorFromPostgrest', () => {
  it('reports a request that never got a response as transport', () => {
    const error = dataErrorFromPostgrest('listCities', NETWORK_DOWN);
    expect(error.code).toBe('transport');
    expect(error.message).toBe('listCities: TypeError: fetch failed');
    expect(error.cause).toBe(NETWORK_DOWN);
  });

  it('reports an answered error as rejected', () => {
    expect(dataErrorFromPostgrest('getCafe', MISSING_TABLE).code).toBe('rejected');
  });
});
