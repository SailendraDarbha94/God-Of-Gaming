import type { StationKind } from '@gog/domain';

/**
 * Every internal URL is built here so the sitemap, links and canonical tags agree. The template
 * literal return types let Next's typed routes check them.
 */
export const paths = {
  home: '/',
  cafes: '/cafes',
  events: '/events',
  download: '/download',
  forCafes: '/for-cafes',
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',
  cafe: (slug: string): `/cafes/${string}` => `/cafes/${slug}`,
  area: (slug: string): `/areas/${string}` => `/areas/${slug}`,
  event: (slug: string): `/events/${string}` => `/events/${slug}`,
  cafesFiltered: (filter: {
    area?: string | undefined;
    kind?: StationKind | undefined;
  }): '/cafes' | `/cafes?${string}` => {
    const params = new URLSearchParams();
    if (filter.area) {
      params.set('area', filter.area);
    }
    if (filter.kind) {
      params.set('kind', filter.kind);
    }
    const query = params.toString();
    return query ? `/cafes?${query}` : '/cafes';
  },
} as const;

export const STATIC_PATHS = [
  paths.home,
  paths.cafes,
  paths.events,
  paths.download,
  paths.forCafes,
  paths.about,
  paths.privacy,
  paths.terms,
] as const;
