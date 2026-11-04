import { Area, Cafe, City, Game, Promotion, Uuid } from '@gog/domain';
import { describe, expect, it } from 'vitest';
import { bengaluru, fixtureId } from './bengaluru';

/**
 * The dataset agrees with docs/spec/08-sample-data.md and supabase/seed.sql: the counts, the id
 * scheme, the constraints of 03 and the choices the seed made where 08 is silent.
 */

const E164 = /^\+[1-9]\d{6,14}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unique<T>(values: T[]): boolean {
  return new Set(values).size === values.length;
}

describe('fixtureId', () => {
  it('right-aligns the suffix in a version-4, variant-8 UUID', () => {
    expect(fixtureId(1)).toBe('00000000-0000-4000-8000-000000000001');
    expect(fixtureId(301)).toBe('00000000-0000-4000-8000-000000000301');
    expect(fixtureId('31107')).toBe('00000000-0000-4000-8000-000000031107');
    expect(Uuid.safeParse(fixtureId(31107)).success).toBe(true);
  });
});

describe('the Bengaluru dataset', () => {
  const { cities, areas, games, cafes, stations, promotions } = bengaluru;
  const tiers = cafes.flatMap((cafe) => cafe.tiers);

  it('has the counts of spec 08', () => {
    expect(cities).toHaveLength(3);
    expect(cities.filter((city) => city.isLive).map((city) => city.slug)).toEqual(['bengaluru']);
    expect(areas).toHaveLength(18);
    expect(games).toHaveLength(16);
    expect(cafes).toHaveLength(6);
    expect(tiers).toHaveLength(15);
    expect(stations).toHaveLength(129);
    expect(cafes.flatMap((cafe) => cafe.images)).toHaveLength(18);
    const hours = cafes.flatMap((cafe) => cafe.hours);
    expect(hours).toHaveLength(42);
    expect(hours.filter((row) => row.isOvernight)).toHaveLength(10);
    expect(cafes.flatMap((cafe) => cafe.games)).toHaveLength(34);
    expect(promotions).toHaveLength(4);
  });

  it('parses with the domain schemas', () => {
    for (const city of cities) {
      expect(() => City.parse(city)).not.toThrow();
    }
    for (const area of areas) {
      expect(() => Area.parse(area)).not.toThrow();
    }
    for (const game of games) {
      expect(() => Game.parse(game)).not.toThrow();
    }
    for (const cafe of cafes) {
      expect(() => Cafe.parse(cafe)).not.toThrow();
    }
    for (const promotion of promotions) {
      expect(() => Promotion.parse(promotion)).not.toThrow();
    }
    for (const station of stations) {
      expect(Uuid.safeParse(station.id).success).toBe(true);
    }
  });

  it('uses unique ids and slugs', () => {
    const ids = [
      ...cities.map((city) => city.id),
      ...areas.map((area) => area.id),
      ...games.map((game) => game.id),
      ...cafes.map((cafe) => cafe.id),
      ...tiers.map((tier) => tier.id),
      ...stations.map((station) => station.id),
      ...cafes.flatMap((cafe) => cafe.images.map((image) => image.id)),
      ...promotions.map((promotion) => promotion.id),
    ];
    expect(unique(ids)).toBe(true);
    for (const slugs of [
      cities.map((city) => city.slug),
      areas.map((area) => area.slug),
      games.map((game) => game.slug),
      cafes.map((cafe) => cafe.slug),
      promotions.map((promotion) => promotion.slug),
    ]) {
      expect(unique(slugs)).toBe(true);
      expect(slugs.every((slug) => SLUG.test(slug))).toBe(true);
    }
  });

  it('follows the id scheme of spec 08', () => {
    expect(cities.map((city) => city.id)).toEqual([1, 2, 3].map(fixtureId));
    expect(areas[0]?.id).toBe(fixtureId(101));
    expect(areas[17]?.id).toBe(fixtureId(118));
    expect(games[0]?.id).toBe(fixtureId(201));
    expect(cafes.map((cafe) => cafe.id)).toEqual([301, 302, 303, 304, 305, 306].map(fixtureId));
    const pixelDen = cafes[0];
    expect(pixelDen?.tiers.map((tier) => tier.id)).toEqual([311, 312, 313].map(fixtureId));
    expect(pixelDen?.images.map((image) => image.id)).toEqual([511, 512, 513].map(fixtureId));
    expect(stations.find((station) => station.id === fixtureId(31107))).toEqual({
      id: fixtureId(31107),
      tierId: fixtureId(311),
      label: 'STD-07',
      isActive: true,
    });
    expect(promotions.map((promotion) => promotion.id)).toEqual(
      [401, 402, 403, 404].map(fixtureId),
    );
  });

  it('gives every tier exactly its stations, labelled per tier', () => {
    for (const tier of tiers) {
      const own = stations.filter((station) => station.tierId === tier.id);
      expect(own).toHaveLength(tier.stationCount);
      expect(unique(own.map((station) => station.label))).toBe(true);
      expect(own.every((station) => /^[A-Z0-9]+-\d{2}$/.test(station.label))).toBe(true);
    }
    const prefixes = new Set(stations.map((station) => station.label.split('-')[0]));
    expect([...prefixes].sort()).toEqual(
      ['ELT', 'NSW', 'PRM', 'PRO', 'PS5', 'ROOM', 'SIM', 'STD', 'STG', 'VR', 'XBX'].sort(),
    );
  });

  it('satisfies the constraints of spec 03', () => {
    for (const cafe of cafes) {
      expect(cafe.status).toBe('live');
      expect(cafe.whatsapp === null || E164.test(cafe.whatsapp)).toBe(true);
      expect(cafe.hours.map((row) => row.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
      for (const row of cafe.hours) {
        // check (case when is_overnight then closes_at <= opens_at else closes_at > opens_at end)
        expect(row.isOvernight ? row.closesAt <= row.opensAt : row.closesAt > row.opensAt).toBe(
          true,
        );
      }
      expect(unique(cafe.tiers.map((tier) => tier.name))).toBe(true);
      expect(cafe.tiers.every((tier) => tier.hourlyRatePaise > 0)).toBe(true);
      expect(cafe.images.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
      expect(unique(cafe.games.map((game) => game.id))).toBe(true);
    }
    for (const promotion of promotions) {
      expect(
        promotion.endsAt === null || Date.parse(promotion.endsAt) > Date.parse(promotion.startsAt),
      ).toBe(true);
    }
  });

  it('offers each cafe only games its station kinds can run', () => {
    for (const cafe of cafes) {
      const kinds = new Set(cafe.tiers.map((tier) => tier.kind));
      for (const game of cafe.games) {
        expect(game.kinds.some((kind) => kinds.has(kind))).toBe(true);
      }
    }
  });

  it('keeps the special hours and the seed choices where 08 is silent', () => {
    const sideQuest = cafes.find((cafe) => cafe.slug === 'side-quest-jayanagar');
    expect(
      sideQuest?.hours.every(
        (row) => row.opensAt === '11:00' && row.closesAt === '23:30' && !row.isOvernight,
      ),
    ).toBe(true);
    const clutchArena = cafes.find((cafe) => cafe.slug === 'clutch-arena-marathahalli');
    expect(clutchArena?.hours[5]).toEqual({
      weekday: 5,
      opensAt: '10:00',
      closesAt: '04:00',
      isOvernight: true,
    });
    const whitefield = cafes.find((cafe) => cafe.slug === 'overclock-lounge-whitefield');
    expect(whitefield?.mapsUrl).toBe('https://maps.google.com/?q=12.9698,77.75');
    expect(whitefield?.lat).toBe(12.9698);
    expect(cafes[0]?.images[0]).toEqual({
      id: fixtureId(511),
      url: 'https://picsum.photos/seed/pixel-den-koramangala-1/1200/800',
      alt: 'Pixel Den, photo 1',
      sortOrder: 0,
    });
    expect(cafes[0]?.tiers[2]?.specs).toEqual({ display: '55" 4K' });
  });

  it('stores promotion instants as UTC from the IST times of spec 08', () => {
    expect(promotions.map((promotion) => [promotion.startsAt, promotion.endsAt])).toEqual([
      ['2026-11-19T12:30:00Z', '2026-11-19T20:30:00Z'],
      ['2026-11-06T18:30:00Z', '2027-01-31T18:29:00Z'],
      ['2026-12-05T05:30:00Z', '2026-12-06T16:30:00Z'],
      ['2026-11-03T18:30:00Z', null],
    ]);
    expect(promotions.map((promotion) => promotion.isFeatured)).toEqual([true, true, false, false]);
    expect(promotions.map((promotion) => promotion.cafe?.slug ?? null)).toEqual([
      'side-quest-jayanagar',
      null,
      'clutch-arena-marathahalli',
      'pixel-den-koramangala',
    ]);
  });
});
