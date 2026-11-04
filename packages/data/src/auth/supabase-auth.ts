import { AuthRetryableFetchError, type AuthError, type Session } from '@supabase/supabase-js';
import type { DataClient } from '../client';
import { instantFromEpochMs } from '../columns';
import { DataError } from '../errors';
import { parseOrThrow } from '../parse';
import { AuthSession, type AuthGateway, type AuthStateListener } from './gateway';

/** GoTrue's session to ours: the user id, the digits-only phone and the token expiry. */
export function toAuthSession(session: Session): AuthSession {
  return parseOrThrow(
    AuthSession,
    {
      userId: session.user.id,
      phone: session.user.phone ?? null,
      expiresAt:
        session.expires_at === undefined ? null : instantFromEpochMs(session.expires_at * 1000),
    },
    'AuthSession',
  );
}

/** A refused step is `auth`; a request that never reached GoTrue is `transport`. */
function authFailure(what: string, error: AuthError): DataError {
  return new DataError(
    error instanceof AuthRetryableFetchError ? 'transport' : 'auth',
    `${what}: ${error.message}`,
    { cause: error },
  );
}

/**
 * Phone OTP through Supabase Auth (spec 06, ADR 0011). `phone` is E.164 with the leading `+`;
 * GoTrue strips it before storing or matching, which is why sessions carry digits only.
 */
export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly client: DataClient) {}

  async signInWithPhone(phone: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({ phone });
    if (error !== null) {
      throw authFailure('signInWithOtp', error);
    }
  }

  async verifyOtp(phone: string, token: string): Promise<AuthSession> {
    const { data, error } = await this.client.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error !== null) {
      throw authFailure('verifyOtp', error);
    }
    if (data.session === null) {
      throw new DataError('invalid_response', 'verifyOtp succeeded without a session');
    }
    return toAuthSession(data.session);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error !== null) {
      throw authFailure('signOut', error);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error !== null) {
      throw authFailure('getSession', error);
    }
    return data.session === null ? null : toAuthSession(data.session);
  }

  onAuthStateChange(listener: AuthStateListener): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session === null ? null : toAuthSession(session));
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }
}
