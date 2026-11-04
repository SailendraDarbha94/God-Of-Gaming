import type { Metadata } from 'next';

import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { PromoCard } from '@/components/PromoCard';
import { site } from '@/config/site';
import { catalog, loadList, now } from '@/lib/data';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: `Events and offers at gaming cafes in ${site.city.name}`,
  description: `Launch nights, tournaments, squad deals and late-night rates at gaming cafes in ${site.city.name}. Reserve seats for your squad in the app.`,
  path: paths.events,
});

export default async function EventsPage() {
  // Featured first, then soonest start: the order `listPromotions` returns on both data sources
  // (spec 04), pinned by the catalog contract suite, so the page does not sort again.
  const promotions = await loadList('listPromotions', () =>
    catalog().listPromotions({ citySlug: site.defaultCitySlug, at: now() }),
  );

  return (
    <>
      <div className="container-x py-12 sm:py-16">
        <p className="eyebrow mb-3">Events and offers</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s on at gaming cafes in {site.city.name}
        </h1>
        <p className="text-muted mt-3 max-w-2xl">
          Launch nights, tournaments, squad deals and late-night rates, as cafes announce them.
          Times are IST.
        </p>
        <div className="mt-8">
          {promotions.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {promotions.map((promotion) => (
                <li key={promotion.id} className="flex">
                  <PromoCard promotion={promotion} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing scheduled right now"
              message="Cafes post launch nights, tournaments and offers here. Check back soon."
              action={{ href: paths.cafes, label: 'Browse cafes' }}
            />
          )}
        </div>
      </div>
      <DownloadCta />
    </>
  );
}
