/**
 * The apps hold the anon (publishable) Supabase key and nothing else (ADR 0011): a service-role key
 * pasted into `EXPO_PUBLIC_SUPABASE_ANON_KEY` would be inlined into the public app bundle and bypass
 * every RLS policy. The dashboard shows both keys side by side, so the mistake is one paste away.
 *
 * Policy: reject only what is recognisably a secret and accept everything else. Refused: `sb_secret_`
 * anywhere in the value, and any JWT whose payload does not say `role: "anon"` (service_role, a
 * user's `authenticated` token, an undecodable `eyJ…` string), whether it is the whole value or sits
 * inside other text. A quoted or prefixed paste (`"sb_secret_…"`, `Bearer eyJ…`) never works as a
 * key, but it would still be bundled into public JavaScript. `sb_publishable_*` keys, anon JWTs and
 * any other string pass, and the server judges their validity.
 */

const SECRET_KEY_MARKER = 'sb_secret_';
const JWT_PREFIX = 'eyJ';
/**
 * A JWT's header and payload are base64url JSON objects, so each starts with `eyJ` (`{"`). This finds
 * every JWT inside other text, so a paste of both legacy keys cannot hide the service_role one
 * behind the anon one; a publishable key has no dot, so it cannot match by chance.
 */
const JWT_IN_TEXT = /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*/g;

/** Why a key was refused, without the key itself: the message may end up in a log. */
export class PublishableKeyError extends Error {
  constructor(message: string) {
    super(
      `${message}; apps/web and apps/player take only the anon/publishable key, never the service-role key (ADR 0011)`,
    );
    this.name = 'PublishableKeyError';
  }
}

/** base64url with the padding hosted Supabase leaves off (payloads carrying `ref`/`iat`). */
function decodeBase64Url(segment: string): string | null {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

/** The `role` claim of a JWT, or `null` when the token cannot be read as one. */
function jwtRole(token: string): string | null {
  const payload = token.split('.')[1];
  if (payload === undefined) {
    return null;
  }
  const json = decodeBase64Url(payload);
  if (json === null) {
    return null;
  }
  try {
    const claims: unknown = JSON.parse(json);
    if (typeof claims !== 'object' || claims === null || !('role' in claims)) {
      return null;
    }
    return typeof claims.role === 'string' ? claims.role : null;
  } catch {
    return null;
  }
}

function jwtRefusal(token: string): string | null {
  const role = jwtRole(token);
  if (role === null) {
    return 'holds a JWT whose payload cannot be read';
  }
  return role === 'anon' ? null : `holds a JWT with role "${role}"`;
}

function refusal(key: string): string | null {
  if (key.includes(SECRET_KEY_MARKER)) {
    return 'holds an sb_secret_ key';
  }
  if (key.startsWith(JWT_PREFIX)) {
    const whole = jwtRefusal(key);
    if (whole !== null) {
      return whole;
    }
  }
  for (const [token] of key.matchAll(JWT_IN_TEXT)) {
    const reason = jwtRefusal(token);
    if (reason !== null) {
      return reason;
    }
  }
  return null;
}

/** True unless the key is recognisably a secret (for Zod `refine`s in the apps' env schemas). */
export function isPublishableKey(key: string): boolean {
  return refusal(key) === null;
}

/** The key itself, or a `PublishableKeyError` naming the role found and the rule. */
export function assertPublishableKey(key: string): string {
  const reason = refusal(key);
  if (reason !== null) {
    throw new PublishableKeyError(`the Supabase key ${reason}`);
  }
  return key;
}
