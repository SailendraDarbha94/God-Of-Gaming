import type { Area } from '@gog/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { AreaLinks } from '@/components/AreaLinks';
import { CafeGrid } from '@/components/CafeGrid';
import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { site } from '@/config/site';
import { catalog, load, loadList, type Loaded } from '@/lib/data';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

const listAreas = cache((): Promise<Area[]> => catalog().listAreas(site.defaultCitySlug));

async function findArea(slug: string): Promise<Loaded<Area | null>> {
  const loaded = await load('listAreas', listAreas);
  if (!loaded.ok) {
    return loaded;
  }
  return { ok: true, value: loaded.value.find((area) => area.slug === slug) ?? null };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const areas = await loadList('listAreas', listAreas);
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await findArea(slug);
  if (!loaded.ok || loaded.value === null) {
    return { title: 'Area' };
  }
  const area = loaded.value;
  return pageMetadata({
    title: `Gaming cafes in ${area.name}, ${site.city.name}`,
    description: `Gaming cafes in ${area.name}, ${site.city.name}, with PC tiers, consoles, prices per hour, games and opening hours. Hold seats for your squad in the app.`,
    path: paths.area(area.slug),
  });
}

export default async function AreaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const loaded = await findArea(slug);
  if (!loaded.ok) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="This area is taking a breather"
          message="We could not load it just now. Please try again in a few minutes."
          action={{ href: paths.cafes, label: 'All cafes' }}
        />
      </div>
    );
  }
  const area = loaded.value;
  if (area === null) {
    notFound();
  }

  const [cafes, areas] = await Promise.all([
    loadList('listCafes', () =>
      catalog().listCafes({ citySlug: site.defaultCitySlug, areaSlug: area.slug }),
    ),
    loadList('listAreas', listAreas),
  ]);
  const otherAreas = areas.filter((candidate) => candidate.slug !== area.slug);

  return (
    <>
      <div className="container-x py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-muted mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={paths.cafes} className="hover:text-text">
                Cafes
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">
              {area.name}
            </li>
          </ol>
        </nav>
        <p className="eyebrow mb-3">{site.city.name}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Gaming cafes in {area.name}
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          {cafes.length === 0
            ? `No cafes listed in ${area.name} yet.`
            : `${cafes.length === 1 ? '1 cafe' : `${cafes.length} cafes`} in ${area.name}, all bookable for squads in the app.`}
        </p>
        <div className="mt-8">
          {cafes.length > 0 ? (
            <CafeGrid cafes={cafes} />
          ) : (
            <EmptyState
              title={`Nothing in ${area.name} yet`}
              message={`We are signing cafes across ${site.city.name}. Try a nearby area or see every cafe.`}
              action={{ href: paths.cafes, label: 'All cafes' }}
            />
          )}
        </div>
        {otherAreas.length > 0 ? (
          <section aria-labelledby="other-areas-heading" className="mt-12">
            <h2 id="other-areas-heading" className="font-display mb-4 text-xl font-semibold">
              Other areas
            </h2>
            <AreaLinks areas={otherAreas} />
          </section>
        ) : null}
        <p className="mt-8">
          <Link href={paths.cafes} className="link-accent">
            <span aria-hidden="true">←</span> All cafes in {site.city.name}
          </Link>
        </p>
      </div>
      <DownloadCta />
    </>
  );
}
