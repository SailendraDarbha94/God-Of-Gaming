import { DEFAULT_CITY_SLUG, type Slug, type StationKind } from '@gog/domain';
import { skipToken, useQuery } from '@tanstack/react-query';

import { catalog } from '../../lib/repositories';

/** The Explore tab's chips; `null` means "any" (spec 06). Not @gog/data's `CafeFilter`, which is the request shape. */
export interface ExploreFilter {
  areaSlug: Slug | null;
  kind: StationKind | null;
}

export const catalogKeys = {
  all: ['catalog'] as const,
  areas: (citySlug: Slug) => [...catalogKeys.all, 'areas', citySlug] as const,
  cafes: (citySlug: Slug, filter: ExploreFilter) =>
    [...catalogKeys.all, 'cafes', citySlug, filter.areaSlug, filter.kind] as const,
  cafe: (slug: Slug) => [...catalogKeys.all, 'cafe', slug] as const,
};

const CATALOG_STALE_MS = 5 * 60_000;

export function useAreas() {
  return useQuery({
    queryKey: catalogKeys.areas(DEFAULT_CITY_SLUG),
    queryFn: () => catalog.listAreas(DEFAULT_CITY_SLUG),
    staleTime: CATALOG_STALE_MS,
  });
}

export function useCafes(filter: ExploreFilter) {
  return useQuery({
    queryKey: catalogKeys.cafes(DEFAULT_CITY_SLUG, filter),
    queryFn: () =>
      catalog.listCafes({
        citySlug: DEFAULT_CITY_SLUG,
        // Absent keys rather than `undefined` values, so the repository sees exactly spec 04's filter.
        ...(filter.areaSlug === null ? {} : { areaSlug: filter.areaSlug }),
        ...(filter.kind === null ? {} : { kind: filter.kind }),
      }),
    staleTime: CATALOG_STALE_MS,
  });
}

/** `null` slug (an invalid route parameter) skips the request; the screen shows "not found". */
export function useCafe(slug: Slug | null) {
  return useQuery({
    queryKey: catalogKeys.cafe(slug ?? ''),
    queryFn: slug === null ? skipToken : () => catalog.getCafe(slug),
    staleTime: CATALOG_STALE_MS,
  });
}
