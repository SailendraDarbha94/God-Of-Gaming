import type { AuthGateway } from '@gog/data/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { bookingKeys } from '../features/booking/queries';
import { auth } from '../lib/repositories';

/** Whatever `AuthGateway.getSession()` resolves to while signed in; its shape belongs to @gog/data. */
export type Session = NonNullable<Awaited<ReturnType<AuthGateway['getSession']>>>;

export interface SessionContextValue {
  session: Session | null;
  /** True until the persisted session has been read once; the splash screen waits for this. */
  isRestoring: boolean;
  signOut: () => Promise<void>;
  /**
   * Resolves with the session, opening the sign-in sheet first when there is none. Resolves with
   * `null` when the sheet is dismissed without signing in, so callers can simply stop.
   */
  requireSession: () => Promise<Session | null>;
  /** Re-reads the gateway; the sign-in sheet awaits this after a verified code before closing. */
  refreshSession: () => Promise<Session | null>;
  /** Called by the sign-in sheet as it closes, so a pending `requireSession()` settles. */
  settleSignIn: () => void;
}

type Resolver = (session: Session | null) => void;

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Subscribes to the auth gateway and exposes the session to the tree (spec 06 §Data and session).
 * Every change re-reads `getSession()` rather than trusting callback arguments, so the provider
 * depends only on the gateway's method names. It sits inside `QueryProvider` so that the bookings
 * cache is dropped whenever the account changes: another account's holds must never be shown to
 * the next sign-in on the same phone.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const current = useRef<Session | null>(null);
  const waiting = useRef<Resolver[]>([]);

  const settle = useCallback((value: Session | null) => {
    const resolvers = waiting.current;
    waiting.current = [];
    for (const resolve of resolvers) {
      resolve(value);
    }
  }, []);

  const apply = useCallback(
    (next: Session | null) => {
      const previous = current.current;
      if (next === null || next.userId !== previous?.userId) {
        // Bookings belong to an account; availability grids are cheap to refetch.
        queryClient.removeQueries({ queryKey: bookingKeys.all });
      }
      current.current = next;
      setSession(next);
      if (next !== null) {
        settle(next);
      }
    },
    [queryClient, settle],
  );

  const refresh = useCallback(
    () =>
      auth.getSession().then((next) => {
        apply(next);
        return next;
      }),
    [apply],
  );

  useEffect(() => {
    let mounted = true;
    void auth
      .getSession()
      .then((next) => {
        if (mounted) {
          apply(next);
        }
      })
      .catch((error: unknown) => {
        console.error('Could not restore the session', error);
      })
      .finally(() => {
        if (mounted) {
          setIsRestoring(false);
        }
      });
    const unsubscribe = auth.onAuthStateChange(() => {
      refresh().catch((error: unknown) => {
        console.error('Could not read the session after an auth change', error);
      });
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [apply, refresh]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    await refresh();
  }, [refresh]);

  const requireSession = useCallback(() => {
    if (current.current !== null) {
      return Promise.resolve(current.current);
    }
    return new Promise<Session | null>((resolve) => {
      const sheetIsOpen = waiting.current.length > 0;
      waiting.current.push(resolve);
      if (!sheetIsOpen) {
        router.push('/auth/sign-in');
      }
    });
  }, [router]);

  const settleSignIn = useCallback(() => {
    if (current.current === null) {
      settle(null);
    }
  }, [settle]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isRestoring,
      signOut,
      requireSession,
      refreshSession: refresh,
      settleSignIn,
    }),
    [session, isRestoring, signOut, requireSession, refresh, settleSignIn],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return value;
}
