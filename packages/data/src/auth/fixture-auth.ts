import type { Uuid } from '@gog/domain';
import { DataError } from '../errors';
import { fixtureId } from '../fixtures/bengaluru';
import { sharedFixtureSession, type FixtureSessionStore } from '../fixtures/session-store';
import { settle } from '../fixtures/settle';
import { AuthSession, type AuthGateway, type AuthStateListener } from './gateway';

/** The one code the fixture accepts, the same as `[auth.sms.test_otp]` in supabase/config.toml. */
export const FIXTURE_OTP = '123456';

const E164 = /^\+[1-9]\d{6,14}$/;

/** A stable user id per phone number, so "my bookings" survive a sign-out and sign-in. */
export function userIdForPhone(digits: string): Uuid {
  return fixtureId(digits.slice(-12));
}

/**
 * Phone OTP sign-in without a backend (ADR 0012): any E.164 number may request a code, the code is
 * always `123456`, and the session is written to the shared store the fixture booking repository
 * reads, so the player app's sign-in sheet and booking flow work end to end on fixtures.
 */
export class FixtureAuthGateway implements AuthGateway {
  private pendingPhone: string | null = null;

  constructor(private readonly store: FixtureSessionStore = sharedFixtureSession) {}

  signInWithPhone(phone: string): Promise<void> {
    return settle(() => {
      if (!E164.test(phone)) {
        throw new DataError('auth', `Not an E.164 phone number: ${phone}`);
      }
      this.pendingPhone = phone.slice(1);
    });
  }

  verifyOtp(phone: string, token: string): Promise<AuthSession> {
    return settle(() => {
      const digits = phone.replace(/^\+/, '');
      if (this.pendingPhone !== digits) {
        throw new DataError('auth', 'Request a code for this number first');
      }
      if (token !== FIXTURE_OTP) {
        throw new DataError('auth', 'Token has expired or is invalid');
      }
      const session = AuthSession.parse({
        userId: userIdForPhone(digits),
        phone: digits,
        expiresAt: null,
      });
      this.pendingPhone = null;
      this.store.set(session);
      return session;
    });
  }

  signOut(): Promise<void> {
    return settle(() => {
      this.store.set(null);
    });
  }

  getSession(): Promise<AuthSession | null> {
    return settle(() => this.store.get());
  }

  onAuthStateChange(listener: AuthStateListener): () => void {
    return this.store.subscribe(listener);
  }
}
