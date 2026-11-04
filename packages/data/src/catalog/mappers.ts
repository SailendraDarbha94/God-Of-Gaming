import { Area, Cafe, CafeCard, CafeStatus, City, Promotion, StationKind } from '@gog/domain';
import { z } from 'zod';
import { byName } from '../by-name';
import { InstantColumn, TimeColumn } from '../columns';
import { parseOrThrow } from '../parse';

/**
 * Raw PostgREST rows in, validated domain objects out (spec 04, ADR 0012). Each mapper narrows the
 * `unknown` row with the recorded response shape of its query, renames snake_case to camelCase,
 * orders child collections deterministically and finally parses the result with the domain schema,
 * so nothing reaches the apps that the domain would not accept. A mismatch on either side is a
 * `DataError('invalid_response')`.
 */

const CityRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  state: z.string(),
  is_live: z.boolean(),
});

/** `areas` with `city:cities!inner(slug)` embedded. */
const AreaRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  city: z.object({ slug: z.string() }),
});

/** One row of the `cafe_cards` view. */
const CafeCardRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  city_slug: z.string(),
  city_name: z.string(),
  area_slug: z.string(),
  area_name: z.string(),
  cover_image_url: z.string().nullable(),
  kinds: z.array(StationKind),
  from_hourly_rate_paise: z.number().nullable(),
  station_count: z.number(),
});

const CafeImageRow = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string(),
  sort_order: z.number(),
});

const CafeHoursRow = z.object({
  weekday: z.number(),
  opens_at: TimeColumn,
  closes_at: TimeColumn,
  is_overnight: z.boolean(),
});

/** `station_tiers(*, stations(id))`: the active stations RLS lets through, counted by the mapper. */
const StationTierRow = z.object({
  id: z.string(),
  cafe_id: z.string(),
  kind: StationKind,
  name: z.string(),
  description: z.string().nullable(),
  hourly_rate_paise: z.number(),
  specs: z.record(z.string(), z.string()),
  sort_order: z.number(),
  stations: z.array(z.object({ id: z.string() })),
});

const GameRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  kinds: z.array(StationKind),
});

/** `cafes` with area, city, images, hours, tiers (with station ids) and games embedded. */
const CafeRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: CafeStatus,
  address_line: z.string(),
  lat: z.number(),
  lng: z.number(),
  description: z.string(),
  amenities: z.array(z.string()),
  whatsapp: z.string().nullable(),
  maps_url: z.string().nullable(),
  area: z.object({
    slug: z.string(),
    name: z.string(),
    city: z.object({ slug: z.string(), name: z.string() }),
  }),
  images: z.array(CafeImageRow),
  hours: z.array(CafeHoursRow),
  tiers: z.array(StationTierRow),
  games: z.array(z.object({ game: GameRow.nullable() })),
});

/** `promotions` with `cafe:cafes(id, slug, name)` and `city:cities(slug)` embedded. */
const PromotionRow = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  image_url: z.string().nullable(),
  cafe: z.object({ id: z.string(), slug: z.string(), name: z.string() }).nullable(),
  city: z.object({ slug: z.string() }).nullable(),
  starts_at: InstantColumn,
  ends_at: InstantColumn.nullable(),
  cta_label: z.string().nullable(),
  cta_url: z.string().nullable(),
  is_featured: z.boolean(),
});

function ascending<T>(key: (item: T) => number): (a: T, b: T) => number {
  return (a, b) => key(a) - key(b);
}

export function toCity(row: unknown): City {
  const r = parseOrThrow(CityRow, row, 'cities row');
  return parseOrThrow(
    City,
    { id: r.id, slug: r.slug, name: r.name, state: r.state, isLive: r.is_live },
    'City',
  );
}

export function toArea(row: unknown): Area {
  const r = parseOrThrow(AreaRow, row, 'areas row');
  return parseOrThrow(
    Area,
    { id: r.id, citySlug: r.city.slug, slug: r.slug, name: r.name, lat: r.lat, lng: r.lng },
    'Area',
  );
}

export function toCafeCard(row: unknown): CafeCard {
  const r = parseOrThrow(CafeCardRow, row, 'cafe_cards row');
  return parseOrThrow(
    CafeCard,
    {
      id: r.id,
      slug: r.slug,
      name: r.name,
      city: { slug: r.city_slug, name: r.city_name },
      area: { slug: r.area_slug, name: r.area_name },
      coverImageUrl: r.cover_image_url,
      kinds: r.kinds,
      fromHourlyRatePaise: r.from_hourly_rate_paise,
      stationCount: r.station_count,
    },
    'CafeCard',
  );
}

export function toCafe(row: unknown): Cafe {
  const r = parseOrThrow(CafeRow, row, 'cafes row');
  const tiers = [...r.tiers]
    .sort((a, b) => a.sort_order - b.sort_order || byName(a, b))
    .map((tier) => ({
      id: tier.id,
      cafeId: tier.cafe_id,
      kind: tier.kind,
      name: tier.name,
      description: tier.description,
      hourlyRatePaise: tier.hourly_rate_paise,
      stationCount: tier.stations.length,
      specs: tier.specs,
      sortOrder: tier.sort_order,
    }));
  const games = r.games
    .flatMap((link) => (link.game === null ? [] : [link.game]))
    .sort(byName)
    .map((game) => ({ id: game.id, slug: game.slug, name: game.name, kinds: game.kinds }));
  return parseOrThrow(
    Cafe,
    {
      id: r.id,
      slug: r.slug,
      name: r.name,
      status: r.status,
      city: r.area.city,
      area: { slug: r.area.slug, name: r.area.name },
      addressLine: r.address_line,
      lat: r.lat,
      lng: r.lng,
      description: r.description,
      amenities: r.amenities,
      whatsapp: r.whatsapp,
      mapsUrl: r.maps_url,
      images: [...r.images].sort(ascending((image) => image.sort_order)).map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.alt,
        sortOrder: image.sort_order,
      })),
      hours: [...r.hours].sort(ascending((hours) => hours.weekday)).map((hours) => ({
        weekday: hours.weekday,
        opensAt: hours.opens_at,
        closesAt: hours.closes_at,
        isOvernight: hours.is_overnight,
      })),
      tiers,
      games,
    },
    'Cafe',
  );
}

export function toPromotion(row: unknown): Promotion {
  const r = parseOrThrow(PromotionRow, row, 'promotions row');
  return parseOrThrow(
    Promotion,
    {
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      body: r.body,
      imageUrl: r.image_url,
      cafe: r.cafe,
      citySlug: r.city?.slug ?? null,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      ctaLabel: r.cta_label,
      ctaUrl: r.cta_url,
      isFeatured: r.is_featured,
    },
    'Promotion',
  );
}
