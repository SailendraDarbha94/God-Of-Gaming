import type { Cafe } from '@gog/domain';
import { describe, expect, it } from 'vitest';

import {
  absoluteUrl,
  cafeJsonLd,
  openingHoursSpecification,
  pageMetadata,
  priceRange,
} from '@/lib/seo';

/** Pixel Den, trimmed from 08-sample-data.md. */
const pixelDen: Cafe = {
  id: '00000000-0000-4000-8000-000000000301',
  slug: 'pixel-den-koramangala',
  name: 'Pixel Den',
  status: 'live',
  city: { slug: 'bengaluru', name: 'Bengaluru' },
  area: { slug: 'koramangala', name: 'Koramangala' },
  addressLine: '12, 5th Block, Koramangala',
  lat: 12.9352,
  lng: 77.6245,
  description: 'Two floors of PCs and a PS5 lounge in 5th Block.',
  amenities: ['ac', 'food'],
  whatsapp: '+919999900101',
  mapsUrl: 'https://maps.google.com/?q=12.9352,77.6245',
  images: [
    {
      id: '00000000-0000-4000-8000-000000000511',
      url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
      alt: 'Pixel Den main floor',
      sortOrder: 1,
    },
  ],
  hours: [
    { weekday: 0, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
    { weekday: 5, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
  ],
  tiers: [
    {
      id: '00000000-0000-4000-8000-000000000311',
      cafeId: '00000000-0000-4000-8000-000000000301',
      kind: 'pc',
      name: 'Standard PC',
      description: null,
      hourlyRatePaise: 8000,
      stationCount: 12,
      specs: { gpu: 'RTX 4060', refresh: '165 Hz' },
      sortOrder: 1,
    },
    {
      id: '00000000-0000-4000-8000-000000000313',
      cafeId: '00000000-0000-4000-8000-000000000301',
      kind: 'ps5',
      name: 'PS5 Lounge',
      description: null,
      hourlyRatePaise: 15000,
      stationCount: 4,
      specs: { screen: '55" 4K' },
      sortOrder: 3,
    },
  ],
  games: [],
};

describe('absoluteUrl', () => {
  it('joins a path to the site origin regardless of trailing slash', () => {
    expect(absoluteUrl('https://example.com/', '/cafes')).toBe('https://example.com/cafes');
    expect(absoluteUrl('https://example.com', '/sitemap.xml')).toBe(
      'https://example.com/sitemap.xml',
    );
  });
});

describe('openingHoursSpecification', () => {
  it('maps weekdays to schema.org days and keeps overnight closes as written', () => {
    expect(openingHoursSpecification(pixelDen.hours)).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Sunday',
        opens: '10:00',
        closes: '23:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Friday',
        opens: '10:00',
        closes: '02:00',
      },
    ]);
  });
});

describe('priceRange', () => {
  it('spans the cheapest and dearest tier', () => {
    expect(priceRange(pixelDen.tiers)).toBe('₹80–₹150/hr');
  });

  it('collapses to one rate when every tier costs the same', () => {
    const tier = pixelDen.tiers[0];
    expect(tier).toBeDefined();
    expect(priceRange(tier ? [tier, { ...tier, id: 'other' }] : [])).toBe('₹80/hr');
  });

  it('is null without tiers', () => {
    expect(priceRange([])).toBeNull();
  });
});

describe('cafeJsonLd', () => {
  const jsonLd = cafeJsonLd(pixelDen, 'https://example.com');

  it('describes the cafe as a local business at its canonical URL', () => {
    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'EntertainmentBusiness',
      '@id': 'https://example.com/cafes/pixel-den-koramangala',
      name: 'Pixel Den',
      url: 'https://example.com/cafes/pixel-den-koramangala',
      image: ['https://picsum.photos/seed/pixel-den-koramangala-1/1200/800'],
      telephone: '+919999900101',
      hasMap: 'https://maps.google.com/?q=12.9352,77.6245',
      priceRange: '₹80–₹150/hr',
    });
  });

  it('carries the address and coordinates', () => {
    expect(jsonLd.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: '12, 5th Block, Koramangala',
      addressLocality: 'Bengaluru',
      addressCountry: 'IN',
    });
    expect(jsonLd.geo).toEqual({
      '@type': 'GeoCoordinates',
      latitude: 12.9352,
      longitude: 77.6245,
    });
  });

  it('includes one opening hours specification per weekday row', () => {
    expect(jsonLd.openingHoursSpecification).toHaveLength(2);
  });

  it('leaves optional fields out rather than null', () => {
    const bare = cafeJsonLd(
      { ...pixelDen, whatsapp: null, mapsUrl: null, tiers: [] },
      'https://example.com',
    );
    expect(bare).not.toHaveProperty('telephone');
    expect(bare).not.toHaveProperty('hasMap');
    expect(bare).not.toHaveProperty('priceRange');
  });
});

describe('pageMetadata', () => {
  it('sets the canonical path and a summary card without an image', () => {
    const metadata = pageMetadata({
      title: 'Cafes',
      description: 'All cafes.',
      path: '/cafes',
      image: null,
    });
    expect(metadata.title).toBe('Cafes');
    expect(metadata.alternates).toEqual({ canonical: '/cafes' });
    expect(metadata.openGraph).toMatchObject({ type: 'website', url: '/cafes', title: 'Cafes' });
    expect(metadata.openGraph).not.toHaveProperty('images');
    expect(metadata.twitter).toMatchObject({ card: 'summary' });
  });

  it('uses a large image card when a page has an image', () => {
    const metadata = pageMetadata({
      title: 'Pixel Den',
      description: 'A cafe.',
      path: '/cafes/pixel-den-koramangala',
      image: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
    });
    expect(metadata.openGraph).toMatchObject({
      images: ['https://picsum.photos/seed/pixel-den-koramangala-1/1200/800'],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('lets the home page keep its title out of the template', () => {
    const metadata = pageMetadata({
      title: 'God of Gaming · Gaming cafes',
      description: 'Home.',
      path: '/',
      absoluteTitle: true,
    });
    expect(metadata.title).toEqual({ absolute: 'God of Gaming · Gaming cafes' });
  });
});
