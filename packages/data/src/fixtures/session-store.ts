import type { AuthSession, AuthStateListener } from '../auth/gateway';

/** The one thing the fixture booking repository needs from auth: who is calling right now. */
export interface SessionReader {
  get(): AuthSession | null;
}

/**
 * The in-memory session shared by the fixture auth gateway (which writes it) and the fixture
 * booking repository (which reads it), so signing in through the fixture gateway makes holds
 * possible and `listMine` personal, exactly as the Supabase pair behaves (ADR 0012).
 */
export class FixtureSessionStore implements SessionReader {
  private session: AuthSession | null = null;
  private readonly listeners = new Set<AuthStateListener>();

  get(): AuthSession | null {
    return this.session;
  }

  set(session: AuthSession | null): void {
    this.session = session;
    for (const listener of this.listeners) {
      listener(session);
    }
  }

  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** The store the factory hands to both fixture implementations when none is injected. */
export const sharedFixtureSession = new FixtureSessionStore();
