import { describe, expect, it } from 'vitest';
import { DataError } from '../errors';
import { toArea, toCafe, toCafeCard, toCity, toPromotion } from './mappers';

/**
 * Recorded PostgREST row shapes (snake_case, `+00:00` instants, `HH:MM:SS` times, embedded
 * resources under their aliases) to the domain objects the apps receive.
 */

const CITY_ROW = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'bengaluru',
  name: 'Bengaluru',
  state: 'Karnataka',
  is_live: true,
  lat: 12.9716,
  lng: 77.5946,
  created_at: '2026-11-04T06:30:00.123456+00:00',
  updated_at: '2026-11-04T06:30:00.123456+00:00',
};

const AREA_ROW = {
  id: '00000000-0000-4000-8000-000000000101',
  slug: 'koramangala',
  name: 'Koramangala',
  lat: 12.9352,
  lng: 77.6245,
  city: { slug: 'bengaluru' },
};

const CAFE_CARD_ROW = {
  id: '00000000-0000-4000-8000-000000000301',
  slug: 'pixel-den-koramangala',
  name: 'Pixel Den',
  status: 'live',
  city_slug: 'bengaluru',
  city_name: 'Bengaluru',
  area_slug: 'koramangala',
  area_name: 'Koramangala',
  cover_image_url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
  kinds: ['pc', 'ps5'],
  from_hourly_rate_paise: 8000,
  station_count: 24,
};

const CAFE_ROW = {
  id: '00000000-0000-4000-8000-000000000301',
  slug: 'pixel-den-koramangala',
  name: 'Pixel Den',
  status: 'live',
  address_line: '12, 5th Block, Koramangala',
  lat: 12.9352,
  lng: 77.6245,
  description: 'A 24-seat PC and PS5 cafe on 5th Block.',
  amenities: ['ac', 'food', 'late-night'],
  whatsapp: '+919999900101',
  maps_url: 'https://maps.google.com/?q=12.9352,77.6245',
  area: {
    slug: 'koramangala',
    name: 'Koramangala',
    city: { slug: 'bengaluru', name: 'Bengaluru' },
  },
  // Children arrive in storage order; the mapper sorts them.
  images: [
    {
      id: '00000000-0000-4000-8000-000000000513',
      url: 'https://picsum.photos/seed/pixel-den-koramangala-3/1200/800',
      alt: 'Pixel Den, photo 3',
      sort_order: 2,
    },
    {
      id: '00000000-0000-4000-8000-000000000511',
      url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
      alt: 'Pixel Den, photo 1',
      sort_order: 0,
    },
  ],
  hours: [
    { weekday: 5, opens_at: '10:00:00', closes_at: '02:00:00', is_overnight: true },
    { weekday: 0, opens_at: '10:00:00', closes_at: '23:00:00', is_overnight: false },
  ],
  tiers: [
    {
      id: '00000000-0000-4000-8000-000000000313',
      cafe_id: '00000000-0000-4000-8000-000000000301',
      kind: 'ps5',
      name: 'PS5 Lounge',
      description: 'PS5 consoles on 55-inch 4K screens in a separate room.',
      hourly_rate_paise: 15000,
      specs: { display: '55" 4K' },
      sort_order: 2,
      created_at: '2026-11-04T06:30:00+00:00',
      updated_at: '2026-11-04T06:30:00+00:00',
      stations: [
        { id: '00000000-0000-4000-8000-000000031301' },
        { id: '00000000-0000-4000-8000-000000031302' },
      ],
    },
    {
      id: '00000000-0000-4000-8000-000000000311',
      cafe_id: '00000000-0000-4000-8000-000000000301',
      kind: 'pc',
      name: 'Standard PC',
      description: null,
      hourly_rate_paise: 8000,
      specs: { gpu: 'RTX 4060', refresh_rate: '165 Hz' },
      sort_order: 0,
      created_at: '2026-11-04T06:30:00+00:00',
      updated_at: '2026-11-04T06:30:00+00:00',
      stations: [
        { id: '00000000-0000-4000-8000-000000031101' },
        { id: '00000000-0000-4000-8000-000000031102' },
        { id: '00000000-0000-4000-8000-000000031103' },
      ],
    },
  ],
  games: [
    {
      game: {
        id: '00000000-0000-4000-8000-000000000201',
        slug: 'valorant',
        name: 'Valorant',
        kinds: ['pc'],
      },
    },
    { game: null },
    {
      game: {
        id: '00000000-0000-4000-8000-000000000202',
        slug: 'counter-strike-2',
        name: 'Counter-Strike 2',
        kinds: ['pc'],
      },
    },
  ],
};

const PROMOTION_ROW = {
  id: '00000000-0000-4000-8000-000000000401',
  slug: 'gta-vi-launch-night',
  title: 'GTA VI launch night',
  summary: 'Play Grand Theft Auto VI from the first minute.',
  body: 'Paragraph one.\n\nParagraph two.',
  image_url: 'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
  starts_at: '2026-11-19T12:30:00+00:00',
  ends_at: '2026-11-19T20:30:00+00:00',
  cta_label: 'Reserve a PS5 in the app',
  cta_url: 'gog://cafe/side-quest-jayanagar',
  is_featured: true,
  cafe: {
    id: '00000000-0000-4000-8000-000000000305',
    slug: 'side-quest-jayanagar',
    name: 'Side Quest',
  },
  city: { slug: 'bengaluru' },
};

describe('toCity', () => {
  it('maps a cities row and drops columns the domain does not carry', () => {
    expect(toCity(CITY_ROW)).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      slug: 'bengaluru',
      name: 'Bengaluru',
      state: 'Karnataka',
      isLive: true,
    });
  });

  it('rejects a row without the recorded shape', () => {
    expect(() => toCity({ ...CITY_ROW, is_live: 'yes' })).toThrow(DataError);
    expect(() => toCity(null)).toThrow(DataError);
  });
});

describe('toArea', () => {
  it('takes the city slug from the embedded city', () => {
    expect(toArea(AREA_ROW)).toEqual({
      id: '00000000-0000-4000-8000-000000000101',
      citySlug: 'bengaluru',
      slug: 'koramangala',
      name: 'Koramangala',
      lat: 12.9352,
      lng: 77.6245,
    });
  });

  it('rejects an area whose slug the domain refuses', () => {
    expect(() => toArea({ ...AREA_ROW, slug: 'Not A Slug' })).toThrow(DataError);
  });
});

describe('toCafeCard', () => {
  it('maps a cafe_cards view row', () => {
    expect(toCafeCard(CAFE_CARD_ROW)).toEqual({
      id: '00000000-0000-4000-8000-000000000301',
      slug: 'pixel-den-koramangala',
      name: 'Pixel Den',
      city: { slug: 'bengaluru', name: 'Bengaluru' },
      area: { slug: 'koramangala', name: 'Koramangala' },
      coverImageUrl: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
      kinds: ['pc', 'ps5'],
      fromHourlyRatePaise: 8000,
      stationCount: 24,
    });
  });

  it('keeps a cafe without images or stations as nulls and zero', () => {
    expect(
      toCafeCard({
        ...CAFE_CARD_ROW,
        cover_image_url: null,
        kinds: [],
        from_hourly_rate_paise: null,
        station_count: 0,
      }),
    ).toMatchObject({ coverImageUrl: null, kinds: [], fromHourlyRatePaise: null, stationCount: 0 });
  });

  it('rejects an unknown station kind', () => {
    expect(() => toCafeCard({ ...CAFE_CARD_ROW, kinds: ['toaster'] })).toThrow(DataError);
  });
});

describe('toCafe', () => {
  it('maps the nested row, counting stations and ordering children', () => {
    const cafe = toCafe(CAFE_ROW);
    expect(cafe).toMatchObject({
      id: '00000000-0000-4000-8000-000000000301',
      status: 'live',
      city: { slug: 'bengaluru', name: 'Bengaluru' },
      area: { slug: 'koramangala', name: 'Koramangala' },
      addressLine: '12, 5th Block, Koramangala',
      amenities: ['ac', 'food', 'late-night'],
      whatsapp: '+919999900101',
      mapsUrl: 'https://maps.google.com/?q=12.9352,77.6245',
    });
    expect(cafe.images.map((image) => image.sortOrder)).toEqual([0, 2]);
    expect(cafe.images[0]).toEqual({
      id: '00000000-0000-4000-8000-000000000511',
      url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
      alt: 'Pixel Den, photo 1',
      sortOrder: 0,
    });
    expect(cafe.hours).toEqual([
      { weekday: 0, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
      { weekday: 5, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
    ]);
    expect(cafe.tiers.map((tier) => [tier.name, tier.stationCount, tier.sortOrder])).toEqual([
      ['Standard PC', 3, 0],
      ['PS5 Lounge', 2, 2],
    ]);
    expect(cafe.tiers[0]).toEqual({
      id: '00000000-0000-4000-8000-000000000311',
      cafeId: '00000000-0000-4000-8000-000000000301',
      kind: 'pc',
      name: 'Standard PC',
      description: null,
      hourlyRatePaise: 8000,
      stationCount: 3,
      specs: { gpu: 'RTX 4060', refresh_rate: '165 Hz' },
      sortOrder: 0,
    });
    expect(cafe.games.map((game) => game.name)).toEqual(['Counter-Strike 2', 'Valorant']);
  });

  it('rejects specs that are not flat string values', () => {
    const tiers = CAFE_ROW.tiers.map((tier) => ({ ...tier, specs: { refresh_rate: 165 } }));
    expect(() => toCafe({ ...CAFE_ROW, tiers })).toThrow(DataError);
  });

  it('rejects a cafe whose area embed is missing', () => {
    expect(() => toCafe({ ...CAFE_ROW, area: null })).toThrow(DataError);
  });
});

describe('toPromotion', () => {
  it('maps instants to UTC Z and the embedded cafe and city', () => {
    expect(toPromotion(PROMOTION_ROW)).toEqual({
      id: '00000000-0000-4000-8000-000000000401',
      slug: 'gta-vi-launch-night',
      title: 'GTA VI launch night',
      summary: 'Play Grand Theft Auto VI from the first minute.',
      body: 'Paragraph one.\n\nParagraph two.',
      imageUrl: 'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
      cafe: {
        id: '00000000-0000-4000-8000-000000000305',
        slug: 'side-quest-jayanagar',
        name: 'Side Quest',
      },
      citySlug: 'bengaluru',
      startsAt: '2026-11-19T12:30:00Z',
      endsAt: '2026-11-19T20:30:00Z',
      ctaLabel: 'Reserve a PS5 in the app',
      ctaUrl: 'gog://cafe/side-quest-jayanagar',
      isFeatured: true,
    });
  });

  it('maps a city-wide, open-ended promotion with nulls', () => {
    expect(
      toPromotion({
        ...PROMOTION_ROW,
        cafe: null,
        city: null,
        ends_at: null,
        cta_label: null,
        cta_url: null,
        image_url: null,
      }),
    ).toMatchObject({
      cafe: null,
      citySlug: null,
      endsAt: null,
      ctaLabel: null,
      ctaUrl: null,
      imageUrl: null,
    });
  });

  it('rejects an instant Postgres would never send', () => {
    expect(() => toPromotion({ ...PROMOTION_ROW, starts_at: 'yesterday' })).toThrow(DataError);
  });
});
