import type { Promotion } from '@gog/domain';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { DownloadCta } from '@/components/DownloadCta';
import { EmptyState } from '@/components/EmptyState';
import { Markdown } from '@/components/Markdown';
import { site } from '@/config/site';
import { catalog, load, loadList, now } from '@/lib/data';
import { formatPromotionWindow } from '@/lib/format';
import { paths } from '@/lib/paths';
import { pageMetadata } from '@/lib/seo';
import { ctaTarget } from '@/lib/store-links';

export const revalidate = 300;
export const dynamicParams = true;

type Params = Promise<{ slug: string }>;

const getPromotion = cache((slug: string): Promise<Promotion | null> =>
  catalog().getPromotion(slug),
);

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const promotions = await loadList('listPromotions', () =>
    catalog().listPromotions({ citySlug: site.defaultCitySlug, at: now() }),
  );
  return promotions.map((promotion) => ({ slug: promotion.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await load(`getPromotion(${slug})`, () => getPromotion(slug));
  if (!loaded.ok || loaded.value === null) {
    return { title: 'Event' };
  }
  const promotion = loaded.value;
  return pageMetadata({
    title: promotion.title,
    description: promotion.summary,
    path: paths.event(promotion.slug),
    image: promotion.imageUrl,
  });
}

function Cta({ label, url }: { label: string; url: string }) {
  const target = ctaTarget(url);
  switch (target.kind) {
    case 'internal':
      // Promotion CTAs are authored as site paths (`/cafes`) or cafe deep links, which `ctaTarget`
      // has already turned into cafe pages. A URL object keeps `Link` navigation for a path that
      // typed routes cannot check statically.
      return (
        <Link href={{ pathname: target.href }} className="btn btn-primary btn-lg">
          {label}
        </Link>
      );
    case 'external':
      return (
        <a href={target.href} rel="noopener noreferrer" className="btn btn-primary btn-lg">
          {label}
        </a>
      );
  }
}

/** The event's next step: its own call to action while it runs, "Browse cafes" otherwise. */
function NextStep({ promotion, hasEnded }: { promotion: Promotion; hasEnded: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {promotion.ctaUrl && !hasEnded ? (
        <Cta label={promotion.ctaLabel ?? 'Learn more'} url={promotion.ctaUrl} />
      ) : (
        <Link href={paths.cafes} className="btn btn-primary btn-lg">
          Browse cafes
        </Link>
      )}
      <p className="text-muted text-sm">Seats are reserved in the {site.name} app.</p>
    </div>
  );
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const loaded = await load(`getPromotion(${slug})`, () => getPromotion(slug));
  if (!loaded.ok) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="This event is taking a breather"
          message="We could not load it just now. Please try again in a few minutes."
          action={{ href: paths.events, label: 'All events' }}
        />
      </div>
    );
  }
  const promotion = loaded.value;
  if (promotion === null) {
    notFound();
  }
  const hasEnded = promotion.endsAt !== null && Date.parse(promotion.endsAt) < Date.parse(now());

  return (
    <>
      <article className="container-x py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-muted mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href={paths.events} className="hover:text-text">
                Events
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-text">
              {promotion.title}
            </li>
          </ol>
        </nav>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-8">
            <header>
              <p className="eyebrow mb-2">{promotion.isFeatured ? 'Featured event' : 'Event'}</p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {promotion.title}
              </h1>
              <p className="text-muted mt-3">
                {formatPromotionWindow(promotion.startsAt, promotion.endsAt)}
              </p>
              {promotion.cafe ? (
                <p className="mt-2">
                  At{' '}
                  <Link href={paths.cafe(promotion.cafe.slug)} className="link-accent">
                    {promotion.cafe.name}
                  </Link>
                </p>
              ) : (
                <p className="mt-2">Across {site.city.name}</p>
              )}
              {hasEnded ? <p className="mt-3 text-sm">This event has ended.</p> : null}
              {/* On phones the next step sits here, before the body; the aside takes over from `lg`. */}
              <div className="mt-5 lg:hidden">
                <NextStep promotion={promotion} hasEnded={hasEnded} />
              </div>
            </header>
            {promotion.imageUrl ? (
              <div className="bg-surface-2 relative aspect-[2/1] overflow-hidden rounded-lg">
                <Image
                  src={promotion.imageUrl}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <p className="text-lg leading-8">{promotion.summary}</p>
            <Markdown source={promotion.body} />
          </div>
          <aside
            aria-labelledby="cta-heading"
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <div className="card flex flex-col gap-4 p-5">
              <h2 id="cta-heading" className="font-display text-lg font-semibold">
                Next step
              </h2>
              <NextStep promotion={promotion} hasEnded={hasEnded} />
            </div>
          </aside>
        </div>
      </article>
      <DownloadCta />
    </>
  );
}
