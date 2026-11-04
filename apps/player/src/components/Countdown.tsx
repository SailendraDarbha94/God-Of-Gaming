import type { IsoInstant } from '@gog/domain';
import { useEffect, useRef, useState } from 'react';

import { Text, type TextProps } from './Text';

export interface CountdownProps extends Omit<TextProps, 'children'> {
  until: IsoInstant;
  /** The clock to count against (the app's server-corrected clock, never `Date.now()` directly). */
  now: () => IsoInstant;
  /** Called once, when the remaining time first reaches zero. */
  onExpire?: () => void;
}

function remainingSeconds(until: IsoInstant, now: () => IsoInstant): number {
  return Math.max(0, Math.ceil((Date.parse(until) - Date.parse(now())) / 1000));
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** "9:58" counting down to `until`, re-rendered every second. */
export function Countdown({ until, now, onExpire, ...textProps }: CountdownProps) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(until, now));
  const [trackedUntil, setTrackedUntil] = useState(until);
  const expiredFor = useRef<IsoInstant | null>(null);

  // A new target resets the display during render (React's "adjusting state on prop change").
  if (trackedUntil !== until) {
    setTrackedUntil(until);
    setSeconds(remainingSeconds(until, now));
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(remainingSeconds(until, now));
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [until, now]);

  useEffect(() => {
    if (seconds === 0 && expiredFor.current !== until) {
      expiredFor.current = until;
      onExpire?.();
    }
  }, [seconds, until, onExpire]);

  return (
    <Text accessibilityLiveRegion="polite" {...textProps}>
      {formatRemaining(seconds)}
    </Text>
  );
}
