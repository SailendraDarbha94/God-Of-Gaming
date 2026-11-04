import { describe, expect, it } from 'vitest';
import { err, ok, type Result } from './result';

describe('Result', () => {
  it('ok wraps a value', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 });
  });

  it('err wraps an error', () => {
    expect(err('boom')).toEqual({ ok: false, error: 'boom' });
  });

  it('narrows on the ok discriminant', () => {
    const results: Result<number, string>[] = [ok(1), err('no')];
    const values = results.map((result) => (result.ok ? result.value * 2 : result.error.length));
    expect(values).toEqual([2, 2]);
  });
});
