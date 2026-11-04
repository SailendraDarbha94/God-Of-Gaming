import { DataError } from '@gog/data';

export type AuthStep = 'send' | 'verify';

/**
 * Sign-in copy keyed by what went wrong (spec 04: the gateway distinguishes `transport`, GoTrue
 * unreachable, from `auth`, the provider refused the step). A player on a flaky connection is told
 * about the connection, not that their number or code is wrong.
 */
export const AUTH_COPY = {
  sendFailed: 'Could not send the code. Check the number and try again.',
  verifyFailed: 'That code did not work. Check it or request a new one.',
  offline: 'Could not reach the sign-in service. Check your connection and try again.',
} as const;

export function authErrorMessage(error: unknown, step: AuthStep): string {
  if (error instanceof DataError && error.code === 'transport') {
    return AUTH_COPY.offline;
  }
  switch (step) {
    case 'send':
      return AUTH_COPY.sendFailed;
    case 'verify':
      return AUTH_COPY.verifyFailed;
  }
}
