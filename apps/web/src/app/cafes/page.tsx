import type { Metadata } from 'next';

import { CafeFilters, type CafeFilterSelection } from '@/components/CafeFilters';
import { CafeGrid } from '@/components/CafeGrid';
import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { site } from '@/config/site';
import { catalog, loadList } from '@/lib/data';
import { formatCafeCount, isStationKind } from '@/lib/format';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

// Reading `searchParams` makes this page dynamic (a server render per request, spec 05); the
// catalog reads behind it are plain function calls, so a `revalidate` export would change nothing.
export const metadata: Metadata = pageMetadata({
  title: `Gaming cafes in ${site.city.name}`,
  description: `Every gaming cafe on ${site.name} in ${site.city.name}: PC tiers, PS5, Xbox, VR and sim rigs with prices per hour, games and opening hours. Filter by area and by what you want to play on.`,
  path: paths.cafes,
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CafesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const repo = catalog();
  const citySlug = site.defaultCitySlug;
  const areas = await loadList('listAreas', () => repo.listAreas(citySlug));

  // Filters come from the URL; anything not in the catalog is ignored rather than rejected.
  const requestedArea = first(params.area);
  const requestedKind = first(params.kind);
  const area = areas.find((candidate) => candidate.slug === requestedArea);
  const kind =
    requestedKind !== undefined && isStationKind(requestedKind) ? requestedKind : undefined;
  const selected: CafeFilterSelection = {
    ...(area ? { area: area.slug } : {}),
    ...(kind ? { kind } : {}),
  };

  const cafes = await loadList('listCafes', () =>
    repo.listCafes({
      citySlug,
      ...(area ? { areaSlug: area.slug } : {}),
      ...(kind ? { kind } : {}),
    }),
  );

  return (
    <>
      <div className="container-x py-12 sm:py-16">
        <p className="eyebrow mb-3">Cafes</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Gaming cafes in {area ? `${area.name}, ` : ''}
          {site.city.name}
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          Prices are per station per hour. Every cafe here takes squad bookings in the app.
        </p>
        <div className="mt-8">
          <CafeFilters areas={areas} selected={selected} />
        </div>
        <p className="text-muted mt-6 text-sm" role="status">
          {formatCafeCount(cafes.length)}
        </p>
        <div className="mt-4">
          {cafes.length > 0 ? (
            <CafeGrid cafes={cafes} />
          ) : (
            <EmptyState
              title="No cafes match these filters yet"
              message={`We are adding cafes across ${site.city.name}. Try another area or station kind.`}
              action={{ href: paths.cafes, label: 'Clear filters' }}
            />
          )}
        </div>
      </div>
      <DownloadCta />
    </>
  );
}
