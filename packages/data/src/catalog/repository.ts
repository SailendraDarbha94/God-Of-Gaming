import type {
  Area,
  Cafe,
  CafeCard,
  City,
  IsoInstant,
  Promotion,
  Slug,
  StationKind,
} from '@gog/domain';

export interface CafeFilter {
  citySlug: Slug;
  areaSlug?: Slug;
  kind?: StationKind;
}

export interface PromotionFilter {
  citySlug?: Slug;
  featuredOnly?: boolean;
  /** Promotions are listed while published and not ended at this instant. */
  at: IsoInstant;
}

/**
 * Catalog reads shared by the website and the player app (spec 04, ADR 0012). Implementations
 * return what an anonymous reader may see: live cities and cafes, published promotions. They throw
 * `DataError` for transport failures and return `null`, never `undefined`, for "not found".
 */
export interface CatalogRepository {
  listCities(): Promise<City[]>;
  listAreas(citySlug: Slug): Promise<Area[]>;
  listCafes(filter: CafeFilter): Promise<CafeCard[]>;
  listCafeSlugs(citySlug: Slug): Promise<Slug[]>;
  getCafe(slug: Slug): Promise<Cafe | null>;
  listPromotions(filter: PromotionFilter): Promise<Promotion[]>;
  getPromotion(slug: Slug): Promise<Promotion | null>;
}
