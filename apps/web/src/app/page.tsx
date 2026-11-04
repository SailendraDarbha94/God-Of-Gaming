import type { Metadata } from 'next';
import Link from 'next/link';

import { AreaLinks } from '@/components/AreaLinks';
import { CafeGrid } from '@/components/CafeGrid';
import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { HowItWorks } from '@/components/HowItWorks';
import { PromoCard } from '@/components/PromoCard';
import { Section } from '@/components/Section';
import { StoreButtons } from '@/components/StoreButtons';
import { site } from '@/config/site';
import { catalog, loadList, now } from '@/lib/data';
import { env } from '@/lib/env';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';
import { storeLinks } from '@/lib/store-links';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: `${site.name} · ${site.tagline}`,
  description: site.description,
  path: paths.home,
  absoluteTitle: true,
});

const FEATURED_CAFE_COUNT = 6;

export default async function HomePage() {
  const repo = catalog();
  const citySlug = site.defaultCitySlug;
  const [cafes, promotions, areas] = await Promise.all([
    loadList('listCafes', () => repo.listCafes({ citySlug })),
    loadList('listPromotions(featured)', () =>
      repo.listPromotions({ citySlug, featuredOnly: true, at: now() }),
    ),
    loadList('listAreas', () => repo.listAreas(citySlug)),
  ]);
  const stores = storeLinks({ appStoreUrl: env.appStoreUrl, playStoreUrl: env.playStoreUrl });

  return (
    <>
      <section aria-labelledby="hero-heading" className="container-x py-16 sm:py-24">
        <p className="eyebrow mb-3">{site.city.name}</p>
        <h1
          id="hero-heading"
          className="font-display max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          {site.tagline}
        </h1>
        <p className="text-muted mt-5 max-w-xl text-lg">
          See every cafe&apos;s PC tiers, consoles, prices per hour, games and opening hours here.
          Hold seats for everyone and confirm in the app.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <StoreButtons stores={stores} />
          <Link href={paths.cafes} className="btn btn-secondary btn-lg">
            Browse cafes
          </Link>
        </div>
      </section>

      <Section id="how-it-works" eyebrow="How it works" title="Find, hold, confirm, play">
        <HowItWorks />
      </Section>

      <Section
        id="featured"
        eyebrow="Featured"
        title="Events and offers"
        action={{ href: paths.events, label: 'All events' }}
      >
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
            title="Nothing featured right now"
            message="Launch nights, tournaments and late-night rates show up here as cafes announce them."
            action={{ href: paths.events, label: 'See all events' }}
          />
        )}
      </Section>

      <Section
        id="cafes"
        eyebrow="Cafes"
        title={`Gaming cafes in ${site.city.name}`}
        action={{ href: paths.cafes, label: 'See all cafes' }}
      >
        {cafes.length > 0 ? (
          <CafeGrid cafes={cafes.slice(0, FEATURED_CAFE_COUNT)} />
        ) : (
          <EmptyState
            title="Cafes are on their way"
            message={`We are signing cafes across ${site.city.name} right now. Check back soon.`}
          />
        )}
      </Section>

      {areas.length > 0 ? (
        <Section id="areas" eyebrow="Areas" title="Browse by area">
          <AreaLinks areas={areas} />
        </Section>
      ) : null}

      <Section
        id="for-cafes"
        eyebrow="For cafes"
        title={`Run a gaming cafe in ${site.city.name}?`}
        action={{ href: paths.forCafes, label: 'How listing works' }}
      >
        <p className="text-muted max-w-2xl">
          Get listed with your tiers, prices, games and hours, and take squad bookings from the app
          instead of over the phone. No listing fee while we launch.
        </p>
      </Section>

      <DownloadCta />
    </>
  );
}
