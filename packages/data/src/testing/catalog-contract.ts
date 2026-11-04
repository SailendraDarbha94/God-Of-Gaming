import { Cafe, CafeCard, isBookable, Promotion, type IsoInstant } from '@gog/domain';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CatalogRepository } from '../catalog/repository';
import { fixtureId } from '../fixtures/bengaluru';

export type CatalogFactory = () => CatalogRepository | Promise<CatalogRepository>;

/** Instants around the sample promotions (spec 08): before GTA VI night, after it, after January. */
const BEFORE_LAUNCH_NIGHT: IsoInstant = '2026-11-10T00:00:00Z';
const AFTER_LAUNCH_NIGHT: IsoInstant = '2026-11-25T00:00:00Z';
const FEBRUARY: IsoInstant = '2027-02-01T00:00:00Z';

const SAMPLE_CAFE_NAMES = [
  'Clutch Arena',
  'Frame Rate',
  'Overclock Lounge',
  'Pixel Den',
  'Respawn Room',
  'Side Quest',
];

const SAMPLE_CAFE_SLUGS = [
  'clutch-arena-marathahalli',
  'frame-rate-indiranagar',
  'overclock-lounge-whitefield',
  'pixel-den-koramangala',
  'respawn-room-hsr',
  'side-quest-jayanagar',
];

/**
 * The behaviour every `CatalogRepository` must share (ADR 0012), stated against the sample dataset
 * of spec 08, which both the fixtures and `supabase/seed.sql` encode. Run it against each
 * implementation; a Supabase target must be seeded and otherwise untouched.
 */
export function describeCatalogRepository(name: string, factory: CatalogFactory): void {
  describe(name, () => {
    let repository: CatalogRepository;

    beforeAll(async () => {
      repository = await factory();
    });

    describe('listCities', () => {
      it('lists live cities only', async () => {
        const cities = await repository.listCities();
        expect(cities.map((city) => city.slug)).toEqual(['bengaluru']);
        expect(cities[0]).toEqual({
          id: fixtureId(1),
          slug: 'bengaluru',
          name: 'Bengaluru',
          state: 'Karnataka',
          isLive: true,
        });
      });
    });

    describe('listAreas', () => {
      it('lists the eighteen Bengaluru areas by name', async () => {
        const areas = await repository.listAreas('bengaluru');
        expect(areas).toHaveLength(18);
        const names = areas.map((area) => area.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
        expect(names[0]).toBe('Banashankari');
        expect(areas.every((area) => area.citySlug === 'bengaluru')).toBe(true);
        expect(areas.find((area) => area.slug === 'koramangala')).toEqual({
          id: fixtureId(101),
          citySlug: 'bengaluru',
          slug: 'koramangala',
          name: 'Koramangala',
          lat: 12.9352,
          lng: 77.6245,
        });
      });

      it('lists nothing for a city that is not live or unknown', async () => {
        expect(await repository.listAreas('pune')).toEqual([]);
        expect(await repository.listAreas('atlantis')).toEqual([]);
      });
    });

    describe('listCafes', () => {
      it('lists the six live cafes as cards, by name', async () => {
        const cards = await repository.listCafes({ citySlug: 'bengaluru' });
        expect(cards.map((card) => card.name)).toEqual(SAMPLE_CAFE_NAMES);
        for (const card of cards) {
          expect(() => CafeCard.parse(card)).not.toThrow();
          expect(card.city).toEqual({ slug: 'bengaluru', name: 'Bengaluru' });
        }
      });

      it('computes the Pixel Den card from its tiers, stations and images', async () => {
        const cards = await repository.listCafes({ citySlug: 'bengaluru' });
        expect(cards.find((card) => card.slug === 'pixel-den-koramangala')).toEqual({
          id: fixtureId(301),
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

      it('orders kinds as the station_kind enum does', async () => {
        const cards = await repository.listCafes({ citySlug: 'bengaluru' });
        expect(cards.find((card) => card.slug === 'side-quest-jayanagar')?.kinds).toEqual([
          'ps5',
          'xbox',
          'switch',
        ]);
      });

      it('filters by area', async () => {
        const koramangala = await repository.listCafes({
          citySlug: 'bengaluru',
          areaSlug: 'koramangala',
        });
        expect(koramangala.map((card) => card.slug)).toEqual(['pixel-den-koramangala']);
        expect(await repository.listCafes({ citySlug: 'bengaluru', areaSlug: 'hebbal' })).toEqual(
          [],
        );
      });

      it('filters by station kind', async () => {
        const slugsFor = async (kind: 'pc' | 'vr' | 'sim_racing' | 'switch' | 'other') =>
          (await repository.listCafes({ citySlug: 'bengaluru', kind })).map((card) => card.slug);
        expect(await slugsFor('vr')).toEqual(['overclock-lounge-whitefield']);
        expect(await slugsFor('sim_racing')).toEqual(['frame-rate-indiranagar']);
        expect(await slugsFor('switch')).toEqual(['side-quest-jayanagar']);
        expect(await slugsFor('pc')).toHaveLength(5);
        expect(await slugsFor('other')).toEqual([]);
      });

      it('lists nothing for a city that is not live', async () => {
        expect(await repository.listCafes({ citySlug: 'pune' })).toEqual([]);
      });
    });

    describe('listCafeSlugs', () => {
      it('lists every live cafe slug of the city', async () => {
        expect(await repository.listCafeSlugs('bengaluru')).toEqual(SAMPLE_CAFE_SLUGS);
        expect(await repository.listCafeSlugs('pune')).toEqual([]);
      });
    });

    describe('getCafe', () => {
      it('returns the full Pixel Den record with ordered images, hours, tiers and games', async () => {
        const cafe = await repository.getCafe('pixel-den-koramangala');
        expect(cafe).not.toBeNull();
        if (cafe === null) {
          return;
        }
        expect(() => Cafe.parse(cafe)).not.toThrow();
        expect(isBookable(cafe)).toBe(true);
        expect(cafe).toMatchObject({
          id: fixtureId(301),
          slug: 'pixel-den-koramangala',
          name: 'Pixel Den',
          status: 'live',
          city: { slug: 'bengaluru', name: 'Bengaluru' },
          area: { slug: 'koramangala', name: 'Koramangala' },
          addressLine: '12, 5th Block, Koramangala',
          lat: 12.9352,
          lng: 77.6245,
          amenities: ['ac', 'food', 'late-night'],
          whatsapp: null,
          mapsUrl: 'https://maps.google.com/?q=12.9352,77.6245',
        });
        expect(cafe.description.startsWith('A 24-seat PC and PS5 cafe on 5th Block')).toBe(true);

        expect(cafe.images).toEqual(
          [1, 2, 3].map((n) => ({
            id: fixtureId(`51${n}`),
            url: `https://picsum.photos/seed/pixel-den-koramangala-${n}/1200/800`,
            alt: `Pixel Den, photo ${n}`,
            sortOrder: n - 1,
          })),
        );

        expect(cafe.hours.map((hours) => hours.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(cafe.hours[1]).toEqual({
          weekday: 1,
          opensAt: '10:00',
          closesAt: '23:00',
          isOvernight: false,
        });
        expect(cafe.hours[5]).toEqual({
          weekday: 5,
          opensAt: '10:00',
          closesAt: '02:00',
          isOvernight: true,
        });

        expect(cafe.tiers.map((tier) => tier.name)).toEqual([
          'Standard PC',
          'Premium PC',
          'PS5 Lounge',
        ]);
        expect(cafe.tiers.map((tier) => tier.stationCount)).toEqual([12, 8, 4]);
        expect(cafe.tiers.map((tier) => tier.hourlyRatePaise)).toEqual([8000, 12000, 15000]);
        expect(cafe.tiers.map((tier) => tier.kind)).toEqual(['pc', 'pc', 'ps5']);
        expect(cafe.tiers[0]).toEqual({
          id: fixtureId(311),
          cafeId: fixtureId(301),
          kind: 'pc',
          name: 'Standard PC',
          description: 'Everyday competitive PCs on 165 Hz monitors.',
          hourlyRatePaise: 8000,
          stationCount: 12,
          specs: { gpu: 'RTX 4060', refresh_rate: '165 Hz' },
          sortOrder: 0,
        });

        expect(cafe.games.map((game) => game.name)).toEqual([
          'Counter-Strike 2',
          'EA Sports FC 26',
          'Fortnite',
          'Grand Theft Auto V',
          'Marvel Rivals',
          'Valorant',
        ]);
        expect(cafe.games.find((game) => game.slug === 'gta-v')).toEqual({
          id: fixtureId(204),
          slug: 'gta-v',
          name: 'Grand Theft Auto V',
          kinds: ['pc', 'ps5', 'xbox'],
        });
      });

      it('keeps the special opening hours of Side Quest and Clutch Arena', async () => {
        const sideQuest = await repository.getCafe('side-quest-jayanagar');
        expect(sideQuest?.hours).toHaveLength(7);
        expect(
          sideQuest?.hours.every(
            (hours) =>
              hours.opensAt === '11:00' && hours.closesAt === '23:30' && !hours.isOvernight,
          ),
        ).toBe(true);

        const clutchArena = await repository.getCafe('clutch-arena-marathahalli');
        expect(clutchArena?.hours[6]).toEqual({
          weekday: 6,
          opensAt: '10:00',
          closesAt: '04:00',
          isOvernight: true,
        });
        expect(clutchArena?.hours[3]).toEqual({
          weekday: 3,
          opensAt: '10:00',
          closesAt: '23:00',
          isOvernight: false,
        });
      });

      it('returns null for an unknown slug', async () => {
        expect(await repository.getCafe('no-such-cafe')).toBeNull();
      });
    });

    describe('listPromotions', () => {
      it('lists published promotions not ended at the instant, featured first then by start', async () => {
        const promotions = await repository.listPromotions({ at: BEFORE_LAUNCH_NIGHT });
        expect(promotions.map((promotion) => promotion.slug)).toEqual([
          'squad-saturdays',
          'gta-vi-launch-night',
          'late-night-pc-rates',
          'valorant-community-cup',
        ]);
        for (const promotion of promotions) {
          expect(() => Promotion.parse(promotion)).not.toThrow();
        }
      });

      it('maps the GTA VI launch night with its cafe, city and IST instants as UTC', async () => {
        const promotions = await repository.listPromotions({ at: BEFORE_LAUNCH_NIGHT });
        const launchNight = promotions.find(
          (promotion) => promotion.slug === 'gta-vi-launch-night',
        );
        expect(
          launchNight?.body.startsWith('Grand Theft Auto VI releases on 19 November 2026'),
        ).toBe(true);
        expect(launchNight).toMatchObject({
          id: fixtureId(401),
          slug: 'gta-vi-launch-night',
          title: 'GTA VI launch night',
          summary:
            'Play Grand Theft Auto VI from the first minute at Side Quest, Jayanagar, with PS5 seats held for squads.',
          imageUrl: 'https://picsum.photos/seed/gta-vi-launch-night/1200/800',
          cafe: { id: fixtureId(305), slug: 'side-quest-jayanagar', name: 'Side Quest' },
          citySlug: 'bengaluru',
          startsAt: '2026-11-19T12:30:00Z',
          endsAt: '2026-11-19T20:30:00Z',
          ctaLabel: 'Reserve a PS5 in the app',
          ctaUrl: 'gog://cafe/side-quest-jayanagar',
          isFeatured: true,
        });
      });

      it('drops promotions that have ended', async () => {
        const afterNight = await repository.listPromotions({ at: AFTER_LAUNCH_NIGHT });
        expect(afterNight.map((promotion) => promotion.slug)).toEqual([
          'squad-saturdays',
          'late-night-pc-rates',
          'valorant-community-cup',
        ]);
        const february = await repository.listPromotions({ at: FEBRUARY });
        expect(february.map((promotion) => promotion.slug)).toEqual(['late-night-pc-rates']);
      });

      it('filters featured promotions and by city', async () => {
        const featured = await repository.listPromotions({
          at: BEFORE_LAUNCH_NIGHT,
          featuredOnly: true,
        });
        expect(featured.map((promotion) => promotion.slug)).toEqual([
          'squad-saturdays',
          'gta-vi-launch-night',
        ]);
        expect(
          await repository.listPromotions({ at: BEFORE_LAUNCH_NIGHT, citySlug: 'bengaluru' }),
        ).toHaveLength(4);
        expect(
          await repository.listPromotions({ at: BEFORE_LAUNCH_NIGHT, citySlug: 'pune' }),
        ).toEqual([]);
      });
    });

    describe('getPromotion', () => {
      it('returns a city-wide promotion without a cafe', async () => {
        const promotion = await repository.getPromotion('squad-saturdays');
        expect(promotion).toMatchObject({
          id: fixtureId(402),
          cafe: null,
          citySlug: 'bengaluru',
          startsAt: '2026-11-06T18:30:00Z',
          endsAt: '2027-01-31T18:29:00Z',
          ctaLabel: 'Find a cafe',
          ctaUrl: '/cafes',
          isFeatured: true,
        });
      });

      it('returns an open-ended promotion with null end and CTA', async () => {
        expect(await repository.getPromotion('late-night-pc-rates')).toMatchObject({
          cafe: { id: fixtureId(301), slug: 'pixel-den-koramangala', name: 'Pixel Den' },
          startsAt: '2026-11-03T18:30:00Z',
          endsAt: null,
          ctaLabel: null,
          ctaUrl: null,
          isFeatured: false,
        });
      });

      it('returns null for an unknown slug', async () => {
        expect(await repository.getPromotion('no-such-promotion')).toBeNull();
      });
    });
  });
}
