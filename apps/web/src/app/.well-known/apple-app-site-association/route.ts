import { env } from '@/lib/env';

/**
 * Universal Links: tells iOS that cafe pages open in the player app (ADR 0004). Apple fetches this
 * file without an extension and expects `application/json`. 404 until the Team ID and bundle id
 * are configured, so a half-configured site never advertises an app that cannot claim the links.
 */
export function GET(): Response {
  if (!env.appleTeamId || !env.iosBundleId) {
    return new Response(null, { status: 404 });
  }
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [`${env.appleTeamId}.${env.iosBundleId}`],
          components: [{ '/': '/cafes/*', comment: 'Cafe pages open in the player app' }],
        },
      ],
    },
  });
}
