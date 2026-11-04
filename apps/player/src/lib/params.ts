import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import type { z } from 'zod';

export type RouteParams<T> = { ok: true; value: T } | { ok: false };

/**
 * Route parameters are user input (deep links can carry anything), so every screen narrows them
 * with a Zod schema instead of trusting the strings Expo Router hands over.
 */
export function useRouteParams<Schema extends z.ZodType>(
  schema: Schema,
): RouteParams<z.output<Schema>> {
  const params = useLocalSearchParams();
  return useMemo(() => {
    const parsed = schema.safeParse(params);
    return parsed.success ? { ok: true, value: parsed.data } : { ok: false };
  }, [params, schema]);
}
