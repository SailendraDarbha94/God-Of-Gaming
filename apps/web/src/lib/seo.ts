import type { Cafe, OpeningHours, StationTier } from '@gog/domain';
import type { Metadata } from 'next';

import { site } from '@/config/site';
import { formatHourlyRate } from '@/lib/format';

/** schema.org weekday names indexed by `Weekday` (0 = Sunday, as in `Date#getDay()`). */
const SCHEMA_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type JsonLd = Record<string, unknown>;

export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, `${siteUrl.replace(/\/+$/, '')}/`).toString();
}

/**
 * One `OpeningHoursSpecification` per weekday row. For overnight rows `closes` is earlier than
 * `opens`, which is how schema.org and Google express closing after midnight.
 */
export function openingHoursSpecification(hours: OpeningHours[]): JsonLd[] {
  return hours.map((row) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: `https://schema.org/${SCHEMA_DAYS[row.weekday] ?? 'Sunday'}`,
    opens: row.opensAt,
    closes: row.closesAt,
  }));
}

/** "₹70–₹150/hr" from the cheapest and dearest tier, "₹80/hr" when they agree, null without tiers. */
export function priceRange(tiers: StationTier[]): string | null {
  const rates = tiers.map((tier) => tier.hourlyRatePaise);
  if (rates.length === 0) {
    return null;
  }
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return min === max
    ? formatHourlyRate(min)
    : `${formatHourlyRate(min).replace('/hr', '')}–${formatHourlyRate(max)}`;
}

export function cafeJsonLd(cafe: Cafe, siteUrl: string): JsonLd {
  const url = absoluteUrl(siteUrl, `/cafes/${cafe.slug}`);
  const range = priceRange(cafe.tiers);
  return {
    '@context': 'https://schema.org',
    '@type': 'EntertainmentBusiness',
    '@id': url,
    name: cafe.name,
    url,
    description: cafe.description,
    image: cafe.images.map((image) => image.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: cafe.addressLine,
      addressLocality: cafe.city.name,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: cafe.lat,
      longitude: cafe.lng,
    },
    openingHoursSpecification: openingHoursSpecification(cafe.hours),
    ...(range ? { priceRange: range } : {}),
    ...(cafe.whatsapp ? { telephone: cafe.whatsapp } : {}),
    ...(cafe.mapsUrl ? { hasMap: cafe.mapsUrl } : {}),
  };
}

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Site-relative path; resolved against `metadataBase` for canonical and Open Graph URLs. */
  path: string;
  image?: string | null;
  /** Home page only: its title stands alone instead of going through the `%s · name` template. */
  absoluteTitle?: boolean;
}

/** Canonical, Open Graph and Twitter card for a page; the root layout supplies the defaults. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const images = input.image ? [input.image] : undefined;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'en_IN',
      url: input.path,
      title: input.title,
      description: input.description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: input.title,
      description: input.description,
      ...(images ? { images } : {}),
    },
  };
}
