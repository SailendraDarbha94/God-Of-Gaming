import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absoluteUrl(env.siteUrl, '/sitemap.xml'),
  };
}
