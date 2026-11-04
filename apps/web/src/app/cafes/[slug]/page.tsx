import { mapsUrlFor } from '@gog/domain';
import type { Cafe } from '@gog/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { Amenities } from '@/components/Amenities';
import { BookCta } from '@/components/BookCta';
import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { Gallery } from '@/components/Gallery';
import { GameChips } from '@/components/GameChips';
import { HoursTable } from '@/components/HoursTable';
import { JsonLd } from '@/components/JsonLd';
import { TierTable } from '@/components/TierTable';
import { site } from '@/config/site';
import { catalog, load, loadList } from '@/lib/data';
import { env } from '@/lib/env';
import { formatHourlyRate, stationKindLabel } from '@/lib/format';
import { paths } from '@/lib/paths';
import { cafeJsonLd, pageMetadata } from '@/lib/seo';
import { storeLinks } from '@/lib/store-links';

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

// `generateMetadata` and the page both need the cafe; `cache` makes that one read per request.
const getCafe = cache((slug: string): Promise<Cafe | null> => catalog().getCafe(slug));

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await loadList('listCafeSlugs', () =>
    catalog().listCafeSlugs(site.defaultCitySlug),
  );
  return slugs.map((slug) => ({ slug }));
}

function tierSummary(cafe: Cafe): string {
  const cheapest = [...cafe.tiers].sort((a, b) => a.hourlyRatePaise - b.hourlyRatePaise)[0];
  const kinds = [...new Set(cafe.tiers.map((tier) => stationKindLabel(tier.kind)))].join(', ');
  return cheapest
    ? `${kinds} from ${formatHourlyRate(cheapest.hourlyRatePaise)}`
    : 'prices, games and opening hours';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await load(`getCafe(${slug})`, () => getCafe(slug));
  if (!loaded.ok || loaded.value === null) {
    return { title: 'Cafe' };
  }
  const cafe = loaded.value;
  return pageMetadata({
    title: `${cafe.name}, ${cafe.area.name}`,
    description: `${cafe.name} in ${cafe.area.name}, ${cafe.city.name}: ${tierSummary(cafe)}. See prices per hour, games and opening hours, then book seats for your squad in the app.`,
    path: paths.cafe(cafe.slug),
    image: cafe.images[0]?.url ?? null,
  });
}

export default async function CafePage({ params }: { params: Params }) {
  const { slug } = await params;
  const loaded = await load(`getCafe(${slug})`, () => getCafe(slug));
  if (!loaded.ok) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="This cafe is taking a breather"
          message="We could not load its details just now. Please try again in a few minutes."
          action={{ href: paths.cafes, label: 'All cafes' }}
        />
      </div>
    );
  }
  const cafe = loaded.value;
  if (cafe === null) {
    notFound();
  }

  const stores = storeLinks({ appStoreUrl: env.appStoreUrl, playStoreUrl: env.playStoreUrl });
  const paragraphs = cafe.description.split(/\n\s*\n/).filter((text) => text.trim().length > 0);

  return (
    <>
      <JsonLd data={cafeJsonLd(cafe, env.siteUrl)} />
      <article className="container-x py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-muted mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={paths.cafes} className="hover:text-text">
                Cafes
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={paths.area(cafe.area.slug)} className="hover:text-text">
                {cafe.area.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">
              {cafe.name}
            </li>
          </ol>
        </nav>

        <Gallery images={cafe.images} cafeName={cafe.name} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-10">
            <header>
              <p className="eyebrow mb-2">
                {cafe.area.name} · {cafe.city.name}
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {cafe.name}
              </h1>
              <p className="text-muted mt-3">
                {cafe.addressLine} ·{' '}
                <a href={mapsUrlFor(cafe)} rel="noopener noreferrer" className="link-accent">
                  Open in Maps
                </a>
              </p>
              {/* On phones the call to action sits here, before the description; the aside below
                  takes over from `lg` up. Reading, focus and visual order agree at every width. */}
              <div className="mt-5 lg:hidden">
                <BookCta cafe={cafe} stores={stores} />
              </div>
            </header>

            <section aria-labelledby="about-heading" className="flex flex-col gap-4">
              <h2 id="about-heading" className="sr-only">
                About {cafe.name}
              </h2>
              {paragraphs.map((text) => (
                <p key={text} className="max-w-prose leading-7">
                  {text}
                </p>
              ))}
              <Amenities amenities={cafe.amenities} />
            </section>

            <section aria-labelledby="tiers-heading" className="flex flex-col gap-4">
              <h2 id="tiers-heading" className="font-display text-xl font-semibold">
                Stations and prices
              </h2>
              {cafe.tiers.length > 0 ? (
                <TierTable tiers={cafe.tiers} labelledBy="tiers-heading" />
              ) : (
                <p className="text-muted text-sm">Tiers and prices are not listed yet.</p>
              )}
            </section>

            <section aria-labelledby="games-heading" className="flex flex-col gap-4">
              <h2 id="games-heading" className="font-display text-xl font-semibold">
                Games
              </h2>
              <GameChips games={cafe.games} />
            </section>

            <section aria-labelledby="hours-heading" className="flex flex-col gap-4">
              <h2 id="hours-heading" className="font-display text-xl font-semibold">
                Opening hours
              </h2>
              <div className="max-w-sm">
                <HoursTable hours={cafe.hours} />
              </div>
            </section>
          </div>

          <aside
            aria-labelledby="book-heading"
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <div className="card flex flex-col gap-4 p-5">
              <h2 id="book-heading" className="font-display text-lg font-semibold">
                Book in the app
              </h2>
              <BookCta cafe={cafe} stores={stores} />
            </div>
          </aside>
        </div>
      </article>
      <DownloadCta />
    </>
  );
}
