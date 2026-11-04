import { describe, expect, it } from 'vitest';
import {
  Area,
  Cafe,
  CafeCard,
  CafeImage,
  CafeRef,
  City,
  Game,
  isBookable,
  mapsUrlFor,
  OpeningHours,
  PlaceRef,
  Profile,
  Promotion,
  StationTier,
} from './entities';

const CITY_ID = '00000000-0000-4000-8000-000000000001';
const AREA_ID = '00000000-0000-4000-8000-000000000101';
const GAME_ID = '00000000-0000-4000-8000-000000000201';
const CAFE_ID = '00000000-0000-4000-8000-000000000301';
const TIER_ID = '00000000-0000-4000-8000-000000000311';
const PROMOTION_ID = '00000000-0000-4000-8000-000000000401';
const IMAGE_ID = '00000000-0000-4000-8000-000000000511';
const PROFILE_ID = '6f1d2c3b-4a5e-4f60-8b7c-9d0e1f2a3b4c';

const city: City = {
  id: CITY_ID,
  slug: 'bengaluru',
  name: 'Bengaluru',
  state: 'Karnataka',
  isLive: true,
};

const area: Area = {
  id: AREA_ID,
  citySlug: 'bengaluru',
  slug: 'koramangala',
  name: 'Koramangala',
  lat: 12.9352,
  lng: 77.6245,
};

const hours: OpeningHours[] = [
  { weekday: 0, opensAt: '10:00', closesAt: '23:00', isOvernight: false },
  { weekday: 5, opensAt: '10:00', closesAt: '02:00', isOvernight: true },
];

const tier: StationTier = {
  id: TIER_ID,
  cafeId: CAFE_ID,
  kind: 'pc',
  name: 'Standard PC',
  description: 'RTX 4060, 165 Hz',
  hourlyRatePaise: 8000,
  stationCount: 12,
  specs: { gpu: 'RTX 4060', refresh: '165 Hz' },
  sortOrder: 0,
};

const game: Game = { id: GAME_ID, slug: 'valorant', name: 'Valorant', kinds: ['pc'] };

const image: CafeImage = {
  id: IMAGE_ID,
  url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
  alt: 'Main floor',
  sortOrder: 0,
};

const cafe: Cafe = {
  id: CAFE_ID,
  slug: 'pixel-den-koramangala',
  name: 'Pixel Den',
  status: 'live',
  city: { slug: 'bengaluru', name: 'Bengaluru' },
  area: { slug: 'koramangala', name: 'Koramangala' },
  addressLine: '12, 5th Block, Koramangala',
  lat: 12.9352,
  lng: 77.6245,
  description: 'A neighbourhood cafe with two PC tiers and a PS5 lounge.',
  amenities: ['ac', 'food', 'late-night'],
  whatsapp: '+919999900101',
  mapsUrl: 'https://maps.google.com/?q=12.9352,77.6245',
  images: [image],
  hours,
  tiers: [tier],
  games: [game],
};

const card: CafeCard = {
  id: CAFE_ID,
  slug: 'pixel-den-koramangala',
  name: 'Pixel Den',
  city: { slug: 'bengaluru', name: 'Bengaluru' },
  area: { slug: 'koramangala', name: 'Koramangala' },
  coverImageUrl: image.url,
  kinds: ['pc', 'ps5'],
  fromHourlyRatePaise: 8000,
  stationCount: 24,
};

const promotion: Promotion = {
  id: PROMOTION_ID,
  slug: 'gta-vi-launch-night',
  title: 'GTA VI launch night',
  summary: 'Play GTA VI on PS5 from 6 pm on launch day.',
  body: 'First paragraph.\n\nSecond paragraph.',
  imageUrl: 'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
  cafe: { id: CAFE_ID, slug: 'side-quest-jayanagar', name: 'Side Quest' },
  citySlug: 'bengaluru',
  startsAt: '2026-11-19T12:30:00Z',
  endsAt: '2026-11-19T20:30:00Z',
  ctaLabel: 'Reserve a PS5 in the app',
  ctaUrl: 'gog://cafe/side-quest-jayanagar',
  isFeatured: true,
};

const profile: Profile = {
  id: PROFILE_ID,
  displayName: 'Sai',
  phone: '919999900001',
  homeCitySlug: 'bengaluru',
};

describe('entity schemas', () => {
  it.each([
    ['City', City, city],
    ['Area', Area, area],
    ['OpeningHours', OpeningHours, hours[0]],
    ['StationTier', StationTier, tier],
    ['Game', Game, game],
    ['CafeImage', CafeImage, image],
    ['CafeRef', CafeRef, { id: CAFE_ID, slug: 'pixel-den-koramangala', name: 'Pixel Den' }],
    ['PlaceRef', PlaceRef, { slug: 'koramangala', name: 'Koramangala' }],
    ['CafeCard', CafeCard, card],
    ['Cafe', Cafe, cafe],
    ['Promotion', Promotion, promotion],
    ['Profile', Profile, profile],
  ])('%s parses a valid sample unchanged', (_name, schema, sample) => {
    expect(schema.parse(sample)).toEqual(sample);
  });

  it('City requires a boolean isLive', () => {
    expect(City.safeParse({ ...city, isLive: 'yes' }).success).toBe(false);
  });

  it('Area requires coordinates', () => {
    const { lng: _lng, ...withoutLng } = area;
    expect(Area.safeParse(withoutLng).success).toBe(false);
  });

  it('OpeningHours rejects weekday 7 and times with seconds', () => {
    expect(OpeningHours.safeParse({ ...hours[0], weekday: 7 }).success).toBe(false);
    expect(OpeningHours.safeParse({ ...hours[0], opensAt: '10:00:00' }).success).toBe(false);
  });

  it('StationTier rejects negative rates, fractional counts and non-string specs', () => {
    expect(StationTier.safeParse({ ...tier, hourlyRatePaise: -1 }).success).toBe(false);
    expect(StationTier.safeParse({ ...tier, stationCount: 1.5 }).success).toBe(false);
    expect(StationTier.safeParse({ ...tier, specs: { vram: 8 } }).success).toBe(false);
  });

  it('Game rejects unknown kinds', () => {
    expect(Game.safeParse({ ...game, kinds: ['ps4'] }).success).toBe(false);
  });

  it('CafeCard allows null price and cover but not a fractional price', () => {
    expect(
      CafeCard.safeParse({ ...card, fromHourlyRatePaise: null, coverImageUrl: null }).success,
    ).toBe(true);
    expect(CafeCard.safeParse({ ...card, fromHourlyRatePaise: 80.5 }).success).toBe(false);
  });

  it('Cafe requires a known status and nullable contact fields', () => {
    expect(Cafe.safeParse({ ...cafe, status: 'open' }).success).toBe(false);
    expect(Cafe.safeParse({ ...cafe, whatsapp: null, mapsUrl: null }).success).toBe(true);
  });

  it('Promotion allows an open end, a city-wide scope and relative CTA URLs', () => {
    expect(
      Promotion.safeParse({ ...promotion, endsAt: null, cafe: null, ctaUrl: '/cafes' }).success,
    ).toBe(true);
    expect(Promotion.safeParse({ ...promotion, startsAt: '2026-11-19 18:00' }).success).toBe(false);
  });

  it('Profile allows an empty profile', () => {
    expect(
      Profile.safeParse({ id: PROFILE_ID, displayName: null, phone: null, homeCitySlug: null })
        .success,
    ).toBe(true);
    expect(Profile.safeParse({ ...profile, phone: 919999900001 }).success).toBe(false);
  });
});

describe('isBookable', () => {
  it('is true for a live cafe with at least one station', () => {
    expect(isBookable(cafe)).toBe(true);
  });

  it('is true when only one of several tiers has stations', () => {
    const empty: StationTier = {
      ...tier,
      id: TIER_ID,
      name: 'VR Bay',
      kind: 'vr',
      stationCount: 0,
    };
    expect(isBookable({ ...cafe, tiers: [empty, tier] })).toBe(true);
  });

  it('is false when every tier has zero stations', () => {
    expect(isBookable({ ...cafe, tiers: [{ ...tier, stationCount: 0 }] })).toBe(false);
  });

  it('is false without tiers', () => {
    expect(isBookable({ ...cafe, tiers: [] })).toBe(false);
  });

  it.each(['draft', 'paused'] as const)('is false when the cafe is %s', (status) => {
    expect(isBookable({ ...cafe, status })).toBe(false);
  });
});

describe('mapsUrlFor', () => {
  it("prefers the cafe's own map link", () => {
    expect(mapsUrlFor(cafe)).toBe('https://maps.google.com/?q=12.9352,77.6245');
    expect(mapsUrlFor({ ...cafe, mapsUrl: 'https://maps.app.goo.gl/abc' })).toBe(
      'https://maps.app.goo.gl/abc',
    );
  });

  it('falls back to a search on the coordinates', () => {
    expect(mapsUrlFor({ mapsUrl: null, lat: 12.9784, lng: 77.6408 })).toBe(
      'https://maps.google.com/?q=12.9784,77.6408',
    );
  });
});
