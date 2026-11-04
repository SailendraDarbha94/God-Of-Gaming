import type { MetadataRoute } from 'next';

import { site } from '@/config/site';
import { catalog, loadList, now } from '@/lib/data';
import { env } from '@/lib/env';
import { STATIC_PATHS, paths } from '@/lib/paths';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = catalog();
  const citySlug = site.defaultCitySlug;
  const [cafeSlugs, areas, promotions] = await Promise.all([
    loadList('listCafeSlugs', () => repo.listCafeSlugs(citySlug)),
    loadList('listAreas', () => repo.listAreas(citySlug)),
    loadList('listPromotions', () => repo.listPromotions({ citySlug, at: now() })),
  ]);
  const url = (path: string): string => absoluteUrl(env.siteUrl, path);

  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: url(path),
    changeFrequency: path === paths.home ? 'daily' : 'weekly',
    priority: path === paths.home ? 1 : 0.6,
  }));
  for (const slug of cafeSlugs) {
    entries.push({ url: url(paths.cafe(slug)), changeFrequency: 'weekly', priority: 0.8 });
  }
  for (const area of areas) {
    entries.push({ url: url(paths.area(area.slug)), changeFrequency: 'weekly', priority: 0.5 });
  }
  for (const promotion of promotions) {
    entries.push({
      url: url(paths.event(promotion.slug)),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }
  return entries;
}
