import { env } from '@/lib/env';

/**
 * Android App Links: lets the player app claim `https://<site>/cafes/*` (ADR 0004). 404 until the
 * package name and at least one signing-certificate fingerprint are configured.
 */
export function GET(): Response {
  if (!env.androidPackage || env.androidSha256Fingerprints.length === 0) {
    return new Response(null, { status: 404 });
  }
  return Response.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: env.androidPackage,
        sha256_cert_fingerprints: env.androidSha256Fingerprints,
      },
    },
  ]);
}
