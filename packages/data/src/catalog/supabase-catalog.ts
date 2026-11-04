import {
  StationKind,
  type Area,
  type Cafe,
  type CafeCard,
  type City,
  type Promotion,
  type Slug,
} from '@gog/domain';
import { z } from 'zod';
import { byName } from '../by-name';
import type { DataClient } from '../client';
import { InstantColumn } from '../columns';
import { dataErrorFromPostgrest } from '../errors';
import { parseOrThrow, parseRows } from '../parse';
import { toArea, toCafe, toCafeCard, toCity, toPromotion } from './mappers';
import type { CafeFilter, CatalogRepository, PromotionFilter } from './repository';

/**
 * One request per read, RLS does the filtering (spec 04 §Catalog queries). `getCafe` embeds the
 * tiers with their station ids and the mapper counts them: PostgREST aggregates are off on Supabase,
 * so `stations(count)` would error. The area and city embeds are inner joins, so a cafe whose city
 * is not live (RLS hides its area) reads as not found rather than as an unbuildable `Cafe`.
 */
const CAFE_SELECT = `
  id, slug, name, status, address_line, lat, lng, description, amenities, whatsapp, maps_url,
  area:areas!inner(slug, name, city:cities!inner(slug, name)),
  images:cafe_images(id, url, alt, sort_order),
  hours:cafe_hours(weekday, opens_at, closes_at, is_overnight),
  tiers:station_tiers(id, cafe_id, kind, name, description, hourly_rate_paise, specs, sort_order, stations(id)),
  games:cafe_games(game:games(id, slug, name, kinds))
`;

const PROMOTION_COLUMNS =
  'id, slug, title, summary, body, image_url, starts_at, ends_at, cta_label, cta_url, is_featured, cafe:cafes(id, slug, name)';

/** A left join on the city when listing everything; an inner join when filtering by city. */
const PROMOTION_SELECT = `${PROMOTION_COLUMNS}, city:cities(slug)`;
const PROMOTION_SELECT_IN_CITY = `${PROMOTION_COLUMNS}, city:cities!inner(slug)`;

const SlugRow = z.object({ slug: z.string() });

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly client: DataClient) {}

  async listCities(): Promise<City[]> {
    const { data, error } = await this.client
      .from('cities')
      .select('id, slug, name, state, is_live')
      .order('name');
    if (error !== null) {
      throw dataErrorFromPostgrest('listCities', error);
    }
    return parseRows(data, 'cities').map(toCity);
  }

  async listAreas(citySlug: Slug): Promise<Area[]> {
    const { data, error } = await this.client
      .from('areas')
      .select('id, slug, name, lat, lng, city:cities!inner(slug)')
      .eq('city.slug', citySlug)
      .order('name');
    if (error !== null) {
      throw dataErrorFromPostgrest('listAreas', error);
    }
    return parseRows(data, 'areas').map(toArea).sort(byName);
  }

  async listCafes(filter: CafeFilter): Promise<CafeCard[]> {
    let query = this.client.from('cafe_cards').select('*').eq('city_slug', filter.citySlug);
    if (filter.areaSlug !== undefined) {
      query = query.eq('area_slug', filter.areaSlug);
    }
    if (filter.kind !== undefined) {
      // `kinds` is a station_kind[]; `cs.{pc}` is PostgREST's array-contains filter.
      query = query.contains('kinds', `{${StationKind.parse(filter.kind)}}`);
    }
    const { data, error } = await query.order('name');
    if (error !== null) {
      throw dataErrorFromPostgrest('listCafes', error);
    }
    return parseRows(data, 'cafe_cards').map(toCafeCard).sort(byName);
  }

  async listCafeSlugs(citySlug: Slug): Promise<Slug[]> {
    const { data, error } = await this.client
      .from('cafe_cards')
      .select('slug')
      .eq('city_slug', citySlug)
      .order('slug');
    if (error !== null) {
      throw dataErrorFromPostgrest('listCafeSlugs', error);
    }
    return parseRows(data, 'cafe_cards')
      .map((row) => parseOrThrow(SlugRow, row, 'cafe slug').slug)
      .sort();
  }

  async getCafe(slug: Slug): Promise<Cafe | null> {
    const { data, error } = await this.client
      .from('cafes')
      .select(CAFE_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error !== null) {
      throw dataErrorFromPostgrest('getCafe', error);
    }
    return data === null ? null : toCafe(data);
  }

  /** Published (RLS), not ended at `at`; featured first, then by start (the `/events` order). */
  async listPromotions(filter: PromotionFilter): Promise<Promotion[]> {
    // `at` is interpolated into PostgREST filter syntax, so it is re-validated and normalised first.
    const at = parseOrThrow(InstantColumn, filter.at, 'listPromotions at');
    const select: string =
      filter.citySlug === undefined ? PROMOTION_SELECT : PROMOTION_SELECT_IN_CITY;
    let query = this.client
      .from('promotions')
      .select(select)
      .or(`ends_at.is.null,ends_at.gt.${at}`);
    if (filter.citySlug !== undefined) {
      query = query.eq('city.slug', filter.citySlug);
    }
    if (filter.featuredOnly === true) {
      query = query.eq('is_featured', true);
    }
    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('starts_at', { ascending: true });
    if (error !== null) {
      throw dataErrorFromPostgrest('listPromotions', error);
    }
    return parseRows(data, 'promotions').map(toPromotion);
  }

  async getPromotion(slug: Slug): Promise<Promotion | null> {
    const { data, error } = await this.client
      .from('promotions')
      .select(PROMOTION_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    if (error !== null) {
      throw dataErrorFromPostgrest('getPromotion', error);
    }
    return data === null ? null : toPromotion(data);
  }
}
