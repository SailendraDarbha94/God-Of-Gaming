import {
  Area,
  Cafe,
  CafeCard,
  City,
  Promotion,
  StationKind,
  type IsoInstant,
  type Slug,
} from '@gog/domain';
import { byName } from '../by-name';
import { bengaluru, type FixtureDataset } from '../fixtures/bengaluru';
import { settle } from '../fixtures/settle';
import type { CafeFilter, CatalogRepository, PromotionFilter } from './repository';

function epochMs(instant: IsoInstant): number {
  return Date.parse(instant);
}

/**
 * The catalog over the in-memory sample dataset (ADR 0012). It answers what an anonymous reader of
 * the seeded database sees under RLS: live cities, areas of live cities, live cafes in live cities,
 * published promotions. Every object returned is a fresh copy parsed through its domain schema, so
 * a caller cannot alter the dataset.
 */
export class FixtureCatalogRepository implements CatalogRepository {
  constructor(private readonly data: FixtureDataset = bengaluru) {}

  listCities(): Promise<City[]> {
    return settle(() =>
      this.data.cities
        .filter((city) => city.isLive)
        .sort(byName)
        .map((city) => City.parse(city)),
    );
  }

  listAreas(citySlug: Slug): Promise<Area[]> {
    return settle(() =>
      this.isCityLive(citySlug)
        ? this.data.areas
            .filter((area) => area.citySlug === citySlug)
            .sort(byName)
            .map((area) => Area.parse(area))
        : [],
    );
  }

  listCafes(filter: CafeFilter): Promise<CafeCard[]> {
    return settle(() =>
      this.visibleCafes()
        .filter(
          (cafe) =>
            cafe.city.slug === filter.citySlug &&
            (filter.areaSlug === undefined || cafe.area.slug === filter.areaSlug) &&
            (filter.kind === undefined || cafe.tiers.some((tier) => tier.kind === filter.kind)),
        )
        .sort(byName)
        .map(toCard),
    );
  }

  listCafeSlugs(citySlug: Slug): Promise<Slug[]> {
    return settle(() =>
      this.visibleCafes()
        .filter((cafe) => cafe.city.slug === citySlug)
        .map((cafe) => cafe.slug)
        .sort(),
    );
  }

  getCafe(slug: Slug): Promise<Cafe | null> {
    return settle(() => {
      const cafe = this.visibleCafes().find((candidate) => candidate.slug === slug);
      return cafe === undefined ? null : Cafe.parse(cafe);
    });
  }

  /** Published, not ended at `at`; featured first, then by start (the `/events` order). */
  listPromotions(filter: PromotionFilter): Promise<Promotion[]> {
    return settle(() => {
      const at = epochMs(filter.at);
      return this.data.promotions
        .filter(
          (promotion) =>
            (promotion.endsAt === null || epochMs(promotion.endsAt) > at) &&
            (filter.featuredOnly !== true || promotion.isFeatured) &&
            (filter.citySlug === undefined || promotion.citySlug === filter.citySlug),
        )
        .sort(
          (a, b) =>
            Number(b.isFeatured) - Number(a.isFeatured) ||
            epochMs(a.startsAt) - epochMs(b.startsAt),
        )
        .map((promotion) => Promotion.parse(promotion));
    });
  }

  getPromotion(slug: Slug): Promise<Promotion | null> {
    return settle(() => {
      const promotion = this.data.promotions.find((candidate) => candidate.slug === slug);
      return promotion === undefined ? null : Promotion.parse(promotion);
    });
  }

  private isCityLive(citySlug: Slug): boolean {
    return this.data.cities.some((city) => city.slug === citySlug && city.isLive);
  }

  /** `cafes` RLS shows live cafes; their area and city embeds (and cards) need a live city too. */
  private visibleCafes(): Cafe[] {
    return this.data.cafes.filter(
      (cafe) => cafe.status === 'live' && this.isCityLive(cafe.city.slug),
    );
  }
}

/** The `cafe_cards` view computed in memory: kinds in enum order, lowest rate, active stations. */
function toCard(cafe: Cafe): CafeCard {
  const tiersWithStations = cafe.tiers.filter((tier) => tier.stationCount > 0);
  const cover = [...cafe.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return CafeCard.parse({
    id: cafe.id,
    slug: cafe.slug,
    name: cafe.name,
    city: cafe.city,
    area: cafe.area,
    coverImageUrl: cover?.url ?? null,
    kinds: StationKind.options.filter((kind) => cafe.tiers.some((tier) => tier.kind === kind)),
    fromHourlyRatePaise:
      tiersWithStations.length === 0
        ? null
        : Math.min(...tiersWithStations.map((tier) => tier.hourlyRatePaise)),
    stationCount: cafe.tiers.reduce((sum, tier) => sum + tier.stationCount, 0),
  });
}
