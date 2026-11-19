import type { MetadataRoute } from 'next';

/** The partner app is never indexed (ADR 0013). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
