import type { IsoInstant } from '@gog/domain';
import { useEffect, useState } from 'react';

import { nowIso } from './clock';

const DEFAULT_REFRESH_MS = 30_000;

/**
 * "Now" as React state, refreshed on a timer, so a screen left open past IST midnight or past a
 * cafe's closing time recomputes what it derives from the time (the day list, slot selectability)
 * instead of keeping a stale value from its first render.
 */
export function useNow(refreshMs: number = DEFAULT_REFRESH_MS): IsoInstant {
  const [now, setNow] = useState(nowIso);
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(nowIso());
    }, refreshMs);
    return () => {
      clearInterval(timer);
    };
  }, [refreshMs]);
  return now;
}
