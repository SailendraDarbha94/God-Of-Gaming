import { IsoInstant, Uuid } from '@gog/domain';
import { z } from 'zod';

/**
 * What the apps know about the signed-in user (spec 04). No Supabase type leaks through: the
 * phone is digits without `+` (`919999900001`), exactly as GoTrue stores `auth.users.phone` and
 * `profiles.phone` hold it (spec 02); the apps render `+` at the display edge.
 */
export const AuthSession = z.object({
  userId: Uuid,
  phone: z.string().nullable(),
  /** When the access token expires; `null` when the implementation does not expire sessions. */
  expiresAt: IsoInstant.nullable(),
});
export type AuthSession = z.infer<typeof AuthSession>;

export type AuthStateListener = (session: AuthSession | null) => void;

/**
 * Phone OTP sign-in (spec 06 `auth/sign-in.tsx`, ADR 0011). `phone` is E.164 with the leading `+`
 * (`+919999900001`). Failures are `DataError` with code `auth` (the provider refused the step) or
 * `transport`.
 */
export interface AuthGateway {
  signInWithPhone(phone: string): Promise<void>;
  verifyOtp(phone: string, token: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  /** Calls back on every change; returns the unsubscribe function. */
  onAuthStateChange(listener: AuthStateListener): () => void;
}
